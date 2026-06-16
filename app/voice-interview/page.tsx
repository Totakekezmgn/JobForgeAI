"use client";

import { useRef, useState } from "react";
import { authFetch } from "@/lib/authFetch";
import { saveEvaluation } from "@/lib/evaluationStore";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function VoiceInterviewPage() {
  const [company, setCompany] = useState("Visional");
  const [role, setRole] = useState("Webエンジニア");
  const [question, setQuestion] = useState("自己紹介と志望理由を1分程度で話してください。");
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);

  async function startRecording() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("このブラウザは音声認識に対応していません。Chrome推奨です。");
      return;
    }

    setTranscript("");
    setFeedback("");
    setSaveMessage("");
    setDuration(0);
    const start = Date.now();
    setStartedAt(start);
    setIsRecording(true);

    const recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) text += event.results[i][0].transcript;
      setTranscript(text);
    };
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioContextRef.current = audioContext;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setVolume(Math.min(100, Math.round((avg / 128) * 100)));
        setDuration(Math.round((Date.now() - start) / 1000));
        animationRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch {}
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setIsRecording(false);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    audioContextRef.current?.close();
    audioContextRef.current = null;
    if (startedAt) setDuration(Math.round((Date.now() - startedAt) / 1000));
  }

  function localVoiceScore() {
    const chars = transcript.length;
    const minutes = Math.max(duration / 60, 0.1);
    const charsPerMinute = Math.round(chars / minutes);
    let pace = "普通";
    if (charsPerMinute < 180) pace = "ゆっくりすぎる可能性があります";
    if (charsPerMinute >= 180 && charsPerMinute <= 420) pace = "聞き取りやすい可能性が高いです";
    if (charsPerMinute > 420) pace = "早口になっている可能性があります";
    let volumeComment = "音量は普通です";
    if (volume < 10) volumeComment = "声が小さい可能性があります";
    if (volume > 70) volumeComment = "音量は十分ですが、強すぎる可能性もあります";
    return `【簡易音声分析】
発話時間: ${duration}秒
文字数: ${chars}文字
推定話速: ${charsPerMinute}文字/分
話速評価: ${pace}
音量評価: ${volumeComment}

注意:
これはブラウザ上で取得できる簡易指標です。
本格的な抑揚・アクセント・滑舌分析には、音声ファイル解析や専用モデルが必要です。`;
  }

  async function analyze() {
    setLoading(true);
    setSaveMessage("");
    const local = localVoiceScore();
    try {
      // 1) 話し方コーチング(生成系)
      const res = await authFetch("/api/voice-feedback", {
        method: "POST",
        body: JSON.stringify({ company, role, question, transcript, duration, volume, localAnalysis: local })
      });
      const data = await res.json();
      let combined = data.feedback || local;
      if (!res.ok && data.error) combined = `${data.error}\n\n${local}`;

      // 2) 回答内容の独立採点(検証分離: 別コンテキストのAIが採点)
      const evalRes = await authFetch("/api/interview-evaluate", {
        method: "POST",
        body: JSON.stringify({
          company,
          role,
          question,
          answer: transcript,
          voiceMetrics: { durationSeconds: duration, volumeLevel: volume }
        })
      });
      if (evalRes.ok) {
        const evalData = await evalRes.json();
        const ev = evalData.evaluation;
        const saved = saveEvaluation({ company, role, question, evaluation: ev, source: "voice" });
        if (saved) setSaveMessage("採点履歴に保存しました。");
        if (ev && ev.scores) {
          const lines = Object.entries(ev.scores).map(([k, v]) => `${k}: ${v} / 5`).join("\n");
          combined += `\n\n【独立AIによる採点】\n${lines}\n合計: ${ev.total}(判定: ${ev.verdict})\n最弱ポイント: ${ev.weakest_point ?? "-"}\n次の深掘り質問: ${ev.probing_question ?? "-"}`;
        }
      }

      setFeedback(combined);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <section className="hero">
        <h1>音声面接</h1>
        <p>声に出して回答し、文字起こし・話速・音量・回答内容を分析します。</p>
      </section>

      <section className="card">
        <h2>面接条件</h2>
        <label className="label">企業名</label>
        <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} />
        <label className="label">職種</label>
        <input className="input" value={role} onChange={(e) => setRole(e.target.value)} />
        <label className="label">質問</label>
        <textarea className="textarea small" value={question} onChange={(e) => setQuestion(e.target.value)} />
        <button className="button" onClick={isRecording ? stopRecording : startRecording}>{isRecording ? "録音停止" : "音声入力開始"}</button>
        <button className="button secondary" onClick={analyze} disabled={!transcript || loading}>{loading ? "分析中..." : "面接回答を分析"}</button>
        {saveMessage && <p className="muted">{saveMessage}</p>}
        <div style={{ marginTop: 16 }}>
          <p className="muted">音量レベル: {volume}</p>
          <div className="voice-meter"><div className="voice-meter-bar" style={{ width: `${volume}%` }} /></div>
        </div>
      </section>

      <section className="grid" style={{ marginTop: 18 }}>
        <div className="card"><h2>文字起こし</h2><div className="result">{transcript || "ここに音声認識結果が表示されます。"}</div></div>
        <div className="card"><h2>分析結果</h2><div className="result">{feedback || localVoiceScore()}</div></div>
      </section>
    </main>
  );
}
