import { useState } from "react";
import { BarChart2, Calendar, Smile, Hash, X, Plus, Trash2 } from "lucide-react";
import GifPicker from "./GifPicker";

/* ── Poll builder ───────────────────────────────────────────── */
function PollBuilder({ onSubmit, onCancel }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(false);

  function setOption(i, val) {
    setOptions((o) => { const n=[...o]; n[i]=val; return n; });
  }
  function addOption() { if (options.length < 10) setOptions((o) => [...o, ""]); }
  function removeOption(i) { if (options.length > 2) setOptions((o) => o.filter((_,j)=>j!==i)); }

  function handleSubmit() {
    const opts = options.map((t)=>t.trim()).filter(Boolean);
    if (!question.trim() || opts.length < 2) return;
    onSubmit({ question: question.trim(), options: opts.map((text)=>({text})), allowMultiple });
  }

  return (
    <div className="compose-extra-panel">
      <div className="compose-extra-panel__header">
        <BarChart2 size={14} /><span>Create Poll</span>
        <button className="icon-button" type="button" onClick={onCancel} style={{marginLeft:"auto"}}><X size={14}/></button>
      </div>
      <input className="compose-extra-input" placeholder="Ask a question…" value={question} onChange={e=>setQuestion(e.target.value)} maxLength={300} autoFocus />
      <div className="compose-extra-options">
        {options.map((opt, i) => (
          <div key={i} className="compose-extra-option-row">
            <input className="compose-extra-input" placeholder={`Option ${i+1}`} value={opt} onChange={e=>setOption(i,e.target.value)} maxLength={120} />
            {options.length > 2 && <button type="button" className="icon-button" onClick={()=>removeOption(i)}><Trash2 size={12}/></button>}
          </div>
        ))}
        {options.length < 10 && (
          <button type="button" className="text-button text-button--muted" onClick={addOption} style={{display:"flex",alignItems:"center",gap:4,fontSize:"var(--text-xs)"}}><Plus size={12}/>Add option</button>
        )}
      </div>
      <label className="compose-extra-check">
        <input type="checkbox" checked={allowMultiple} onChange={e=>setAllowMultiple(e.target.checked)} />
        <span>Allow multiple answers</span>
      </label>
      <div className="compose-extra-panel__footer">
        <button type="button" className="secondary-button" style={{height:32,padding:"0 14px",fontSize:"var(--text-xs)"}} onClick={onCancel}>Cancel</button>
        <button type="button" className="primary-button" style={{height:32,padding:"0 14px",fontSize:"var(--text-xs)"}} onClick={handleSubmit} disabled={!question.trim()||options.filter(o=>o.trim()).length<2}>Create Poll</button>
      </div>
    </div>
  );
}

/* ── Event builder ──────────────────────────────────────────── */
const EVENT_TYPES = ["birthday","meeting","reminder","other"];

function EventBuilder({ onSubmit, onCancel }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [type, setType] = useState("meeting");
  const [startsAt, setStartsAt] = useState("");

  function handleSubmit() {
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), description: desc.trim(), eventType: type, startsAt: startsAt || undefined });
  }

  return (
    <div className="compose-extra-panel">
      <div className="compose-extra-panel__header">
        <Calendar size={14}/><span>Create Event</span>
        <button className="icon-button" type="button" onClick={onCancel} style={{marginLeft:"auto"}}><X size={14}/></button>
      </div>
      <div className="compose-extra-type-row">
        {EVENT_TYPES.map(t=>(
          <button key={t} type="button" className={`settings-chip${type===t?" settings-chip--active":""}`} style={{fontSize:"var(--text-xs)",padding:"3px 10px"}} onClick={()=>setType(t)}>{t}</button>
        ))}
      </div>
      <input className="compose-extra-input" placeholder="Event title…" value={title} onChange={e=>setTitle(e.target.value)} maxLength={120} autoFocus />
      <input className="compose-extra-input" placeholder="Description (optional)" value={desc} onChange={e=>setDesc(e.target.value)} maxLength={500} />
      <input className="compose-extra-input" type="datetime-local" value={startsAt} onChange={e=>setStartsAt(e.target.value)} />
      <div className="compose-extra-panel__footer">
        <button type="button" className="secondary-button" style={{height:32,padding:"0 14px",fontSize:"var(--text-xs)"}} onClick={onCancel}>Cancel</button>
        <button type="button" className="primary-button" style={{height:32,padding:"0 14px",fontSize:"var(--text-xs)"}} onClick={handleSubmit} disabled={!title.trim()}>Create Event</button>
      </div>
    </div>
  );
}

/* ── Sticker panel (static set) ─────────────────────────────── */
const STICKERS = ["😂","😍","🥺","😎","🤩","🙌","🔥","💯","👀","🎉","🤔","😭","💪","🫡","🥳","😏","🤝","💀","✨","🌟"];

function StickerPanel({ onSelect, onCancel }) {
  return (
    <div className="compose-extra-panel">
      <div className="compose-extra-panel__header">
        <Smile size={14}/><span>Stickers</span>
        <button className="icon-button" type="button" onClick={onCancel} style={{marginLeft:"auto"}}><X size={14}/></button>
      </div>
      <div className="sticker-grid">
        {STICKERS.map(s=>(
          <button key={s} type="button" className="sticker-btn" onClick={()=>onSelect(s)}>{s}</button>
        ))}
      </div>
    </div>
  );
}

/* ── Main toolbar ───────────────────────────────────────────── */
const TOOLS = [
  { id: "poll",    Icon: BarChart2, title: "Create Poll" },
  { id: "event",   Icon: Calendar,  title: "Create Event" },
  { id: "gif",     Icon: Hash,      title: "GIF",     label: "GIF" },
  { id: "sticker", Icon: Smile,     title: "Stickers" },
];

export default function ComposeExtras({ onSendPoll, onSendEvent, onSendGif, onSendSticker }) {
  const [open, setOpen] = useState(null); // null | 'poll' | 'event' | 'gif' | 'sticker'

  function close() { setOpen(null); }

  function handlePoll(data) { onSendPoll?.(data); close(); }
  function handleEvent(data) { onSendEvent?.(data); close(); }
  function handleGif(data) { onSendGif?.(data); close(); }
  function handleSticker(emoji) { onSendSticker?.(emoji); close(); }

  return (
    <div className="compose-extras">
      {/* Toolbar buttons */}
      <div className="compose-extras__toolbar">
        {TOOLS.map(({ id, Icon, title, label }) => (
          <button
            key={id}
            type="button"
            className={`compose-extra-btn${open === id ? " compose-extra-btn--active" : ""}`}
            title={title}
            onClick={() => setOpen((c) => c === id ? null : id)}
          >
            {label ? <span style={{fontSize:10,fontWeight:700}}>{label}</span> : <Icon size={15} />}
          </button>
        ))}
      </div>

      {/* Panels */}
      {open === "poll"    && <PollBuilder    onSubmit={handlePoll}    onCancel={close} />}
      {open === "event"   && <EventBuilder   onSubmit={handleEvent}   onCancel={close} />}
      {open === "gif"     && <GifPicker      onSelect={handleGif}     onClose={close} />}
      {open === "sticker" && <StickerPanel   onSelect={handleSticker} onCancel={close} />}
    </div>
  );
}
