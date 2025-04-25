import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { socket } from '../socket';

const API = import.meta.env.VITE_API_BASE_URL;

function formatDuration(iso) {
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '-';
    const [, h, m, s] = match.map(x => parseInt(x || '0', 10));
    const totalMinutes = (h * 60) + m;
    const seconds = s.toString().padStart(2, '0');
    return `${totalMinutes}:${seconds}`;
}

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
            thumbnail: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default.url,
            duration: video.contentDetails?.duration || ''
        };
        socket.emit('add-to-playlist', song);
        setResults([]); // 추가 후 검색 결과 닫기
    };

    const handleClearResults = () => {
        setResults([]);
    };

    function formatViews(viewCount) {
        const count = parseInt(viewCount, 10);
        if (isNaN(count)) return '-';
        if (count >= 1e6) return `${(count / 1e6).toFixed(1)}M views`;
        if (count >= 1e3) return `${(count / 1e3).toFixed(1)}K views`;
        return `${count}views`;
    }

    return (
        <div className={`d-flex flex-column bg-light p-3  ${className}`}>
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
                <div className="bg-white rounded shadow p-3">
                    <div className="d-flex flex-column gap-2">
                        {results.map((video) => (
                            <div
                                key={video.id.videoId}
                                className="d-flex align-items-start gap-3 border rounded px-3 py-2 justify-content-between"
                            >
                                <div className="d-flex gap-3 align-items-center" style={{ flex: 1, minWidth: 0 }}>
                                    <div className="position-relative" style={{ width: 112, height: 63 }}>
                                        <img
                                            src={video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default.url}
                                            alt={video.snippet.title}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                                        />
                                        {video.contentDetails?.duration && (
                                        <div
                                            className="position-absolute bottom-0 end-0 px-1 py-0 text-white bg-dark"
                                            style={{
                                                fontSize: '12px',
                                                fontWeight: 500,
                                                fontFamily: '"Roboto", "Arial", sans-serif',
                                                margin: '0px',
                                                opacity: 0.8,
                                                lineHeight: 1.2,
                                            }}
                                        >
                                            {formatDuration(video.contentDetails?.duration || '')}
                                        </div>)}
                                    </div>
                                    <div>
                                        <div
                                            className="fw-bold"
                                            style={{
                                                display: '-webkit-box',
                                                WebkitLineClamp: 1,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}
                                        >
                                            {video.snippet.title}
                                        </div>
                                        <div
                                            className="text-muted small"
                                            style={{
                                                display: '-webkit-box',
                                                WebkitLineClamp: 1,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}
                                        >
                                            {video.snippet.channelTitle}
                                        </div>
                                        <div className="text-muted small">
                                            {formatViews(video.statistics?.viewCount)}
                                        </div>

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
                <h5 className="mb-3">플레이리스트</h5>
                {playlist.length === 0 ? (
                    <div className="text-muted">플레이리스트가 비어 있습니다.</div>
                ) : (
                    <div className="d-flex flex-column gap-2">
                        {playlist.map((song, index) => (
                            <div key={song.id} className="d-flex justify-content-between align-items-center border rounded px-3 py-2">
                                <div className="d-flex align-items-center gap-3">
                                    <div style={{ width: 80, height: 45, position: 'relative' }}>
                                        <img
                                            src={song.thumbnail}
                                            alt={song.title}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover', // 'contain' → 'cover'로 바꿔 YouTube 스타일로
                                                borderRadius: 4,
                                            }}
                                        />
                                        {song.duration && (
                                            <div
                                                className="position-absolute bottom-0 end-0 px-1 text-white bg-dark"
                                                style={{
                                                    fontSize: '12px',
                                                    fontWeight: 500,
                                                    fontFamily: '"Roboto", "Arial", sans-serif',
                                                    margin: '0px',
                                                    opacity: 0.8,
                                                    lineHeight: 1.2,
                                                }}
                                            >
                                                {formatDuration(song.duration)}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div
                                            className="fw-bold"
                                            style={{
                                                display: '-webkit-box',
                                                WebkitLineClamp: 1,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}
                                        >
                                            {song.title}
                                        </div>
                                        <div
                                            className="text-muted small"
                                            style={{
                                                display: '-webkit-box',
                                                WebkitLineClamp: 1,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}
                                        >
                                            {song.channel}
                                        </div>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center">
                                    <div className="d-flex flex-column text-end me-2">
                                        <div className="text-muted small">#{index + 1}</div>
                                        <div className="text-muted small">{song.addedBy}</div>
                                    </div>
                                    <button
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => socket.emit('remove-from-playlist', song.id)}
                                    >
                                        <i className="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
