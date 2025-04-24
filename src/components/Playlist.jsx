import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { socket } from '../socket';

const API = import.meta.env.VITE_API_BASE_URL;

export default function PlaylistSearch({ className = '', playlist = [] }) {
    const [search, setSearch] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!search.trim()) return;
        setLoading(true);
        try {
            const res = await axios.get(`${API}/youtube/search?query=${encodeURIComponent(search)}`);
            if (res.data.success) {
                setResults(res.data.items);
            }
        } catch (err) {
            console.error('검색 실패:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToPlaylist = (video) => {
        const song = {
            videoId: video.id.videoId,
            title: video.snippet.title,
            channel: video.snippet.channelTitle,
            thumbnail: video.snippet.thumbnails.default.url
        };
        socket.emit('add-to-playlist', song);
        setResults([]); // 추가 후 검색 결과 닫기
    };

    const handleClearResults = () => {
        setResults([]);
    };

    return (
        <div className={`d-flex flex-column bg-light p-4 ${className}`} style={{ height: '100%' }}>
            {/* 검색창 */}
            <div className="mb-3 input-group">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Search YouTube videos..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
                    {loading ? '검색 중...' : '검색'}
                </button>
                {results.length > 0 && (
                    <button className="btn btn-outline-secondary" onClick={handleClearResults}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                )}
            </div>

            {/* 결과 리스트 */}
            {results.length > 0 && (
                <div className="bg-white rounded shadow p-3 overflow-auto" style={{ maxHeight: '500px' }}>
                    <div className="d-flex flex-column gap-2">
                        {results.map((video) => (
                            <div
                                key={video.id.videoId}
                                className="d-flex align-items-start gap-3 border rounded px-3 py-2 justify-content-between"
                            >
                                <div className="d-flex gap-3">
                                    <img
                                        src={video.snippet.thumbnails.default.url}
                                        alt={video.snippet.title}
                                        className="rounded"
                                    />
                                    <div>
                                        <div className="fw-bold">{video.snippet.title}</div>
                                        <div className="text-muted small">{video.snippet.channelTitle}</div>
                                    </div>
                                </div>
                                <button
                                    className="btn btn-sm btn-success align-self-center"
                                    onClick={() => handleAddToPlaylist(video)}
                                >
                                    <i className="bi bi-plus-circle me-1"></i> 추가
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 현재 플레이리스트 */}
            <div className="mt-4">
                <h5 className="mb-3">🎵 현재 플레이리스트</h5>
                {playlist.length === 0 ? (
                    <div className="text-muted">플레이리스트가 비어 있습니다.</div>
                ) : (
                    <div className="d-flex flex-column gap-2">
                        {playlist.map((song, index) => (
                            <div key={song.id} className="d-flex justify-content-between align-items-center border rounded px-3 py-2">
                                <div className="d-flex align-items-center gap-3">
                                    <img src={song.thumbnail} alt={song.title} style={{ width: 64, height: 48 }} className="rounded" />
                                    <div>
                                        <div className="fw-bold">{song.title}</div>
                                        <div className="text-muted small">{song.channel}</div>
                                        <div className="text-muted small">- {song.addedBy}</div>
                                    </div>
                                </div>
                                <span className="text-muted small">#{index + 1}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
