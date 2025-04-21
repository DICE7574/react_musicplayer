import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { socket } from '../socket';
import YouTube from 'react-youtube';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const API = import.meta.env.VITE_API_BASE_URL;

function Room() {
    const { roomCode } = useParams();
    const location = useLocation();
    const nickname = location.state?.nickname || '익명';

    const youtubeId = "0RkX1mBIjRA";
    const youtubeListID = "PLeSslQPAX32g8skK9TpiAJWqtobywviTp";
    const playerRef = useRef(null);

    const [roomName, setRoomName] = useState('');
    const [members, setMembers] = useState([]);
    const [playlist, setPlaylist] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.2);
    const [isMuted, setIsMuted] = useState(false);
    const [repeatMode, setRepeatMode] = useState("none");

    useEffect(() => {
        const fetchRoomData = async () => {
            try {
                const titleRes = await axios.get(`${API}/room/${roomCode}/title`);
                const membersRes = await axios.get(`${API}/room/${roomCode}/members`);
                const playlistRes = await axios.get(`${API}/room/${roomCode}/playlist`);

                if (titleRes.data.success) setRoomName(titleRes.data.roomName);
                if (membersRes.data.success) setMembers(membersRes.data.members);
                if (playlistRes.data.success) setPlaylist(playlistRes.data.playlist);
            } catch (err) {
                console.error('초기화 실패:', err);
            }
        };

        fetchRoomData();
    }, [roomCode]);

    useEffect(() => {
        const handleMemberUpdate = (updated) => setMembers(updated);
        const handlePlaylistUpdate = (updated) => setPlaylist(updated);

        socket.on('update-members', handleMemberUpdate);
        socket.on('update-playlist', handlePlaylistUpdate);

        return () => {
            socket.off('update-members', handleMemberUpdate);
            socket.off('update-playlist', handlePlaylistUpdate);
        };
    }, []);

    const onReady = (event) => {
        playerRef.current = event.target;
        updateVideoInfo();
        event.target.setVolume(volume * 100);
    };

    const updateVideoInfo = () => {
        if (playerRef.current) {
            setDuration(playerRef.current.getDuration());
            setCurrentTime(playerRef.current.getCurrentTime());
        }
    };

    const togglePlayPause = () => {
        if (!playerRef.current) return;
        if (isPlaying) playerRef.current.pauseVideo();
        else playerRef.current.playVideo();
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e) => {
        const newTime = parseFloat(e.target.value);
        playerRef.current.seekTo(newTime, true);
        setCurrentTime(newTime);
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (playerRef.current) playerRef.current.setVolume(newVolume * 100);
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
        if (playerRef.current) {
            isMuted ? playerRef.current.unMute() : playerRef.current.mute();
            if (isMuted) playerRef.current.setVolume(volume * 100);
        }
    };

    const toggleRepeatMode = () => {
        const next = repeatMode === 'none' ? 'one' : repeatMode === 'one' ? 'all' : 'none';
        setRepeatMode(next);
        if (playerRef.current) playerRef.current.setLoop(next === 'one');
    };

    const playPrevious = () => {
        if (!playerRef.current) return;
        const cur = playerRef.current.getCurrentTime();
        cur > 5 ? playerRef.current.seekTo(0, true) : playerRef.current.previousVideo();
    };

    const playNext = () => {
        if (playerRef.current) playerRef.current.nextVideo();
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if (playerRef.current && isPlaying) {
                setCurrentTime(playerRef.current.getCurrentTime());
            }
        }, 500);
        return () => clearInterval(interval);
    }, [isPlaying]);

    const formatTime = (s) => `${Math.floor(s / 60)}:${('0' + Math.floor(s % 60)).slice(-2)}`;

    return (
        <div className="container mt-4 position-relative">
            <YouTube
                videoId={youtubeId}
                opts={{
                    width: '0',
                    height: '0',
                    playerVars: {
                        listType: 'playlist',
                        list: youtubeListID,
                        autoplay: 0
                    },
                }}
                onReady={onReady}
                onStateChange={updateVideoInfo}
                style={{ pointerEvents: 'none' }}
            />

            <div className="d-flex align-items-center gap-2 mb-3">
                <div className="dropdown">
                    <button
                        className="btn btn-outline-secondary btn-sm dropdown-toggle"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                    >
                        {members.length} <i className="bi bi-people-fill"></i>
                    </button>
                    <ul className="dropdown-menu">
                        {members.map((name, idx) => (
                            <li key={idx}>
                                <div className={`dropdown-item d-flex justify-content-between align-items-center ${name === nickname ? 'bg-secondary text-white' : ''}`}> {/* 내 낵네임 회색 바탕 표현 */}
                                    <span>{name}</span>
                                    {idx === 0 && <span className="ms-2">⭐</span>} {/* 방장 표시 */}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                <h4 className="mb-0">{roomName}</h4>
            </div>

            <div className="card p-4 shadow-sm">
                <div className="d-flex align-items-center mb-3">
                    <input
                        type="range"
                        className="form-range flex-grow-1 me-3"
                        min="0"
                        max={duration}
                        step="0.1"
                        value={currentTime}
                        onChange={handleSeek}
                    />
                    <span style={{ minWidth: 80 }}>{formatTime(currentTime)} / {formatTime(duration)}</span>
                </div>

                <div className="d-flex justify-content-center gap-3">
                    <button className="btn btn-outline-secondary" onClick={playPrevious}>
                        <i className="bi bi-skip-backward-fill"></i>
                    </button>
                    <button className="btn btn-primary" onClick={togglePlayPause}>
                        <i className={`bi ${isPlaying ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>
                    </button>
                    <button className="btn btn-outline-secondary" onClick={playNext}>
                        <i className="bi bi-skip-forward-fill"></i>
                    </button>
                    <button className="btn btn-light" onClick={toggleMute}>
                        <i className={`bi ${isMuted ? 'bi-volume-mute' : 'bi-volume-up'}`}></i>
                    </button>
                    <input
                        type="range"
                        className="form-range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={handleVolumeChange}
                        style={{ width: '80px' }}
                    />
                    <button className={`btn ${repeatMode === 'none' ? 'btn-dark' : 'btn-info'}`} onClick={toggleRepeatMode}>
                        <i className={`bi ${repeatMode === 'one' ? 'bi-repeat-1' : 'bi-repeat'}`}></i>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Room;
