import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

const GIPHY_KEY = import.meta.env.VITE_GIPHY_API_KEY || "";
const GIPHY_SEARCH = "https://api.giphy.com/v1/gifs/search";
const GIPHY_TRENDING = "https://api.giphy.com/v1/gifs/trending";

export default function GifPicker({ onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    fetchGifs("");
  }, []);

  async function fetchGifs(q) {
    if (!GIPHY_KEY) return;
    setLoading(true);
    try {
      const url = q.trim()
        ? `${GIPHY_SEARCH}?api_key=${GIPHY_KEY}&q=${encodeURIComponent(q)}&limit=20&rating=g`
        : `${GIPHY_TRENDING}?api_key=${GIPHY_KEY}&limit=20&rating=g`;
      const res = await fetch(url);
      const json = await res.json();
      setGifs(json.data || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  function handleSearch(val) {
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchGifs(val), 400);
  }

  function select(gif) {
    onSelect({
      gifUrl: gif.images.fixed_height.url,
      gifTitle: gif.title,
    });
  }

  return (
    <div className="gif-picker">
      <div className="gif-picker__header">
        <div className="gif-picker__search">
          <Search size={12} />
          <input
            type="search"
            placeholder="Search GIFs…"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
          />
        </div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close GIF picker">
          <X size={14} />
        </button>
      </div>

      {!GIPHY_KEY && (
        <p className="gif-picker__notice">Add VITE_GIPHY_API_KEY to enable GIF search.</p>
      )}

      <div className="gif-picker__grid">
        {loading && <p className="gif-picker__status">Loading…</p>}
        {!loading && !gifs.length && GIPHY_KEY && (
          <p className="gif-picker__status">No GIFs found.</p>
        )}
        {gifs.map((gif) => (
          <button key={gif.id} type="button" className="gif-item" onClick={() => select(gif)}>
            <img
              src={gif.images.fixed_height_small.url}
              alt={gif.title}
              loading="lazy"
              width={gif.images.fixed_height_small.width}
              height={gif.images.fixed_height_small.height}
            />
          </button>
        ))}
      </div>
      <p className="gif-picker__powered">Powered by GIPHY</p>
    </div>
  );
}
