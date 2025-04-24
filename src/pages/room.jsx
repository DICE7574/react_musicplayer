import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import YouTube from 'react-youtube';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import RoomHeader from '../components/RoomHeader';

const API = import.meta.env.VITE_API_BASE_URL;

function Room() {
    const { roomCode } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
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
    const [showCode, setShowCode] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const connectAndFetch = async () => {
            if (!nickname || !roomCode) return;

            if (!socket.connected) socket.connect();

            socket.emit('connect-room', { roomCode, userName: nickname }, async (res) => {
                if (!res.success) {
                    alert(res.message || '방 연결에 실패했습니다.');
                    socket.disconnect();
                    navigate('/');
                    return;
                }

                // ✅ 연결 성공 후 데이터 요청
                try {
                    const [titleRes, membersRes, playlistRes] = await Promise.all([
                        axios.get(`${API}/room/${roomCode}/title`),
                        axios.get(`${API}/room/${roomCode}/members`),
                        axios.get(`${API}/room/${roomCode}/playlist`)
                    ]);

                    if (titleRes.data.success) setRoomName(titleRes.data.roomName);
                    if (membersRes.data.success) setMembers(membersRes.data.members);
                    if (playlistRes.data.success) setPlaylist(playlistRes.data.playlist);
                } catch (err) {
                    console.error('초기화 실패:', err);
                }
            });
        };

        connectAndFetch();
    }, [roomCode, nickname]);


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

    const copyToClipboard = () => {
        navigator.clipboard.writeText(roomCode).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    };

    const handleLeaveRoom = () => {
        socket.emit('leave-room', { roomCode });
        socket.disconnect();
        navigate('/');
    };


    useEffect(() => {
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = ''; // 경고 창 띄우기
        };

        const handlePageHide = () => {
            socket.emit('leave-room', { roomCode });
            socket.disconnect();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handlePageHide); // 진짜 떠날 때 실행됨

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handlePageHide);
        };
    }, [roomCode]);

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

            {/* 상단 정보 */}
            <RoomHeader
                roomName={roomName}
                roomCode={roomCode}
                members={members}
                nickname={nickname}
                showCode={showCode}
                setShowCode={setShowCode}
                copyToClipboard={copyToClipboard}
                copied={copied}
                handleLeaveRoom={handleLeaveRoom}
            />

            {/* 플레이어 */}
            <div className="card p-4 shadow-sm">
                <div className="mb-3">
                    <input
                        type="range"
                        className="form-range"
                        min="0"
                        max={duration}
                        step="0.1"
                        value={currentTime}
                        onChange={handleSeek}
                    />
                </div>

                <div className="d-flex justify-content-between align-items-center">
                    {/* 왼쪽: 이전/재생/다음 + 현재시간 */}
                    <div className="d-flex align-items-center gap-2">
                        <button className="btn btn-light" onClick={playPrevious}>
                            <i className="bi bi-skip-backward-fill"></i>
                        </button>
                        <button className="btn btn-outline-primary" onClick={togglePlayPause}>
                            <i className={`bi ${isPlaying ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>
                        </button>
                        <button className="btn btn-light" onClick={playNext}>
                            <i className="bi bi-skip-forward-fill"></i>
                        </button>
                        <span className="text-muted small">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    {/* 가운데: 노래 정보 (임시 텍스트) */}
                    <div className="text-center flex-grow-1">
                        <span className="text-secondary d-block">노래 제목</span>
                        <span className="text-secondary d-block">아티스트 정보</span>
                    </div>

                    {/* 오른쪽: 음소거 및 볼륨 */}
                    <div className="d-flex align-items-center gap-2">
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
                            style={{ width: '100px' }}
                        />
                        <button
                            className={`btn ${repeatMode === 'none' ? 'btn-outline-dark' : 'btn-outline-info'}`}
                            onClick={toggleRepeatMode}
                        >
                            <i className={`bi ${repeatMode === 'one' ? 'bi-repeat-1' : 'bi-repeat'}`}></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Room;
