import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import YouTube from 'react-youtube';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import RoomHeader from '../components/RoomHeader';
import Playlist from '../components/Playlist';
import { decode } from 'html-entities';

const API = import.meta.env.VITE_API_BASE_URL;

function Room() {
    const DEBUG = true;

    const { roomCode } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const nickname = location.state?.nickname || '익명';

    //클라이언트에서만 처리하는 변수
    const volumsScale = 20; //최대 볼륨 20% (유튜브 기본 소리 너무 큼)
    const playerRef = useRef(null);
    const [volume, setVolume] = useState(0.5);
    const [isMuted, setIsMuted] = useState(false);
    const [showCode, setShowCode] = useState(false);
    const [copied, setCopied] = useState(false);
    const [hasSynced, setHasSynced] = useState(false);
    const [firstLoad, setFirstLoad] = useState(true);

    // 서버와 함께 처리하는 변수
    const [roomName, setRoomName] = useState('');
    const [members, setMembers] = useState([]);
    const [isPlaying, setIsPlaying] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [repeatMode, setRepeatMode] = useState("none");
    const [playlist, setPlaylist] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

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
                setHasSynced(false);
                setIsPlaying(res.state.isPlaying);
                setRepeatMode(res.state.repeatMode);
                setCurrentTime(res.state.currentTime);
                setCurrentIndex(res.state.currentIndex);

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
        const handlePlayPauseToggled = ({ isPlaying }) => {
            if (!playerRef.current) return;
            if (isPlaying) {
                playerRef.current.playVideo();
            } else {
                playerRef.current.pauseVideo();
            }
            setIsPlaying(isPlaying);
        };
        const handleSeekedTo = ({ time }) => {
            if (playerRef.current) {
                playerRef.current.seekTo(time, true);
                setCurrentTime(time);
            }
        };
        const handleRepeatModeChanged = ({ mode }) => {
            setRepeatMode(mode);
        };
        const handlePlayVideoAt = ({ roomCode, index, time }) => {
            if(roomCode === roomCode)
                playVideoAt(index, time);
        };
        const handleUpdateCurrentIndex = ({ roomCode, index }) => {
            if(roomCode === roomCode)
                setCurrentIndex(index);
        };

        socket.on('update-members', handleMemberUpdate);
        socket.on('update-playlist', handlePlaylistUpdate);
        socket.on('play-pause-toggled', handlePlayPauseToggled);
        socket.on('seeked-to', handleSeekedTo);
        socket.on('repeat-mode-changed', handleRepeatModeChanged);
        socket.on('play-video-at', handlePlayVideoAt);
        socket.on('update-current-index', handleUpdateCurrentIndex);

        return () => {
            socket.off('update-members', handleMemberUpdate);
            socket.off('update-playlist', handlePlaylistUpdate);
            socket.off('play-pause-toggled', handlePlayPauseToggled);
            socket.off('seeked-to', handleSeekedTo);
            socket.off('repeat-mode-changed', handleRepeatModeChanged);
            socket.off('play-video-at', handlePlayVideoAt);
            socket.off('update-current-index', handleUpdateCurrentIndex);
        };
    }, []);

    const onReady = (event) => {
        playerRef.current = event.target;
        console.log('이벤트 타입 (event.data):', event.data);
        //updateVideoInfo(event);
        if (playerRef.current) {
            applyVolumeSettings();
            playerRef.current.seekTo(currentTime, true);
            isPlaying ? playerRef.current.playVideo() : playerRef.current.pauseVideo();
        }
    };

    const updateVideoInfo = (event) => {
        if (!event){
            console.log('이벤트 타입 (event.data):', event.data);
            return;
        }
        console.log('이벤트 타입 (event.data):', event.data);
        applyVolumeSettings(); // 영상 처음에만 소리 큰거 해결

        if (event.data === -1 && firstLoad) {  // 최초 접속시 자동으로 노래 시작 안하는 경우 강제 play
            console.log('✅ 강제 재생 시도');
            const startTime = Date.now();
            const interval = setInterval(() => {
                if (!playerRef.current) return;
                const playerState = playerRef.current.getPlayerState();
                console.log('현재 playerState:', playerState);
                playerRef.current.playVideo();
                // 1. firstLoad가 false로 바뀌었으면 중단
                if (!firstLoad) {
                    console.log('✅ firstLoad false → 반복 종료');
                    clearInterval(interval);
                    return;
                }

                // 2. 시간 초과 시 중단
                if (Date.now() - startTime > 5000) { // 🔥 5초 제한
                    console.warn('⚠️ 반복 제한 시간 초과 → 반복 종료');
                    clearInterval(interval);
                    return;
                }

                if (playerState !== -1) {
                    console.log('▶ Player 준비 완료 → 강제 재생');
                    syncPlayer();
                    setFirstLoad(false); // 🔥 이후 반복 막기
                    clearInterval(interval);
                }
            }, 200);
        }

        if (event.data === 1) { // 노래 시작 후 싱크 맞추기
            setFirstLoad(false); // 시작한 경우 강제 play 비활성화
            if (!hasSynced) {
                console.log('싱크 맞출 시도 진행');
                syncPlayer();
            }
        }

        if (event.data === 0) { // 노래 종료시 다음 노래 재생
            console.log('영상 종료됨');
            if (event.data === 0) {
                if (playerRef.current) {
                    const dur = playerRef.current.getDuration();
                    if (dur > 1) { // 1초 이상짜리 영상이여야 진짜 끝난걸로 간주
                        console.log('▶ 실제로 영상 끝까지 재생됨 → 다음곡 이동', dur);
                        switch (repeatMode) {
                            case 'one':
                                console.log('반복 모드: 한곡');
                                playerRef.current?.seekTo(0, true);
                                break;
                            case 'all':
                                console.log('반복 모드: 전체');
                                currentIndex + 1 >= playlist.length ? autoGoto(0, 0) : autoGoto(currentIndex+1, 0);
                                break;
                            default:
                                if(currentIndex !== playlist.length - 1) {
                                    console.log('다음 곡으로');
                                    autoGoto(currentIndex+1, 0);
                                }
                                else
                                {
                                    console.log('노래 끝나서 영상 정지됨');
                                }
                                break;
                        }
                    } else {
                        console.warn('▶ ended 발생했지만 시간 차이 이상함 → 무시');
                    }
                }
            }
        }

        if (playerRef.current) {
            const duration = playerRef.current.getDuration();
            setDuration(duration);
        }
    };


    const togglePlayPause = () => {
        socket.emit('toggle-play-pause', { roomCode });
    };

    const handleSeek = (e) => {
        const newTime = parseFloat(e.target.value);
        socket.emit('seek-to', { roomCode, time: newTime });
    };

    const toggleRepeatMode = () => {
        const next = repeatMode === 'none' ? 'one' : repeatMode === 'one' ? 'all' : 'none';
        socket.emit('change-repeat-mode', { roomCode, mode: next });
        if (playerRef.current) playerRef.current.setLoop(next === 'one');
    };

    const playPrevious = () => {
        if (!playerRef.current) return;
        const curTime = playerRef.current.getCurrentTime();

        if (curTime > 5) {
            socket.emit('seek-to', { roomCode, time: 0 });
        } else if (currentIndex > 0) {
            socket.emit('play-video-at', { roomCode: roomCode, index: currentIndex - 1, time: 0 });
        }
    };

    const playNext = () => {
        if (currentIndex + 1 < playlist.length) {
            socket.emit('play-video-at', { roomCode: roomCode, index: currentIndex + 1, time: 0 });
        }
    };

    const autoGoto = (inputIndex, inputTime) => {
        if (inputIndex < playlist.length) {
            playVideoAt(inputIndex, inputTime);
            if (members[0]?.id === socket.id)
            {
                socket.emit('update-current-index', {roomCode: roomCode, index: inputIndex, time: inputTime});
            }
        }
    };

    const playVideoAt = (index, time) => {
        if (!playerRef.current) return;

        const currentVideoId = playerRef.current.getVideoData().video_id;
        const nextVideoId = playlist[index]?.videoId;
        if(currentVideoId !== nextVideoId) {
            setHasSynced(false);
            setCurrentIndex(index);
            playerRef.current.seekTo(time, true);
        } else {
            setCurrentIndex(index);
            playerRef.current.seekTo(time, true);
        }

    };

    const syncPlayer = () => {
        if (!socket.connected) return;

        socket.emit('request-sync', { roomCode });

        socket.once('sync-info', ({ isPlaying, currentTime, currentIndex: newIndex, repeatMode }) => {
            if (!playerRef.current) return;

            const playerCurrentTime = playerRef.current.getCurrentTime();

            if (newIndex !== currentIndex) {
                playVideoAt(newIndex, currentTime);
            } else {
                const timeDiff = Math.abs(playerCurrentTime - currentTime);

                if (timeDiff > 1) { // 서버 시간과 1초 이상 차이나면 싱크 맞춤
                    console.log(`▶ 시간 차이 ${timeDiff.toFixed(1)}초 → 싱크 조정`);
                    playerRef.current.seekTo(currentTime, true);
                } else {
                    console.log(`▶ 시간 차이 ${timeDiff.toFixed(1)}초 → 싱크 무시`);
                }
            }

            if (isPlaying) {
                playerRef.current.playVideo();
            } else {
                playerRef.current.pauseVideo();
            }

            setIsPlaying(isPlaying);
            setCurrentTime(currentTime);
            setCurrentIndex(newIndex);
            setRepeatMode(repeatMode);
        });
        setHasSynced(true);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if (playerRef.current && isPlaying) {
                const now = playerRef.current.getCurrentTime();
                setCurrentTime(now);
                if (members[0]?.id === socket.id) {
                    socket.emit('update-current-time', { roomCode, time: now });
                }
            }
        }, 200);
        return () => clearInterval(interval);
    }, [isPlaying, members, nickname, roomCode]);

    const formatTime = (s) => `${Math.floor(s / 60)}:${('0' + Math.floor(s % 60)).slice(-2)}`;

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (playerRef.current) playerRef.current.setVolume(newVolume * volumsScale);
    };

    const toggleMute = () => {
        if (playerRef.current) {
            isMuted ? playerRef.current.unMute() : playerRef.current.mute();
        }
        setIsMuted(!isMuted);
    };

    const applyVolumeSettings = () => {
        if (!playerRef.current) return;

        if (isMuted) {
            playerRef.current.mute();
        } else {
            playerRef.current.unMute();
        }

        playerRef.current.setVolume(volume * volumsScale);
    };

    const copyToClipboard = () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(roomCode).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
            }).catch((err) => {
                console.error('클립보드 복사 실패:', err);
            });
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = roomCode;
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
            } catch (err) {
                console.error('클립보드 복사 실패 (fallback):', err);
            }
            document.body.removeChild(textarea);
        }
    };


    const handleLeaveRoom = () => {
        socket.emit('leave-room', { roomCode });
        socket.disconnect();
        navigate('/');
    };

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = ''; // 페이지 나갈때 경고 창 띄우기
        };

        const handleExit = () => {
            socket.emit('leave-room', { roomCode });
            socket.disconnect();
            navigate('/');
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handleExit);     // 새로고침, 탭 닫기
        window.addEventListener('popstate', handleExit);     // 뒤로가기

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handleExit);
            window.removeEventListener('popstate', handleExit);
        };
    }, [roomCode, navigate]);

    return (
        <div className="container p-0 mt-0 position-relative">
            {DEBUG && (
                <div style={{ position: 'absolute', top: 10, left: 500, background: 'white', padding: '10px', zIndex: 9999 }}>
                    <div>isPlaying: {isPlaying ? 'true' : 'false'}</div>
                    <div>repeatMode: {repeatMode}</div>
                    <div>currentTime: {(currentTime ?? 0).toFixed(1)}</div>
                    <div>currentIndex: {currentIndex} {(playlist[currentIndex]?.videoId ?? 0)}</div>
                    <div>{members[0]?.id} === {socket.id} is {String(members[0]?.id === socket.id)}</div>
                </div>
            )}

            {playlist[currentIndex] && (
                <div style={{ position: 'fixed', top: 50, left: 20, width: '0', height: '0', zIndex: 9999, background: 'black' }}>
                    <YouTube
                        videoId={playlist[currentIndex].videoId}
                        opts={{
                            width: '0',
                            height: '0',
                            playerVars: {
                                autoplay: isPlaying ? 1 : 0
                            },
                        }}
                        onReady={onReady}
                        onStateChange={updateVideoInfo}
                        onError={(e) => {
                            console.error('유튜브 에러 발생', e.data);
                            autoGoto(currentIndex+1, 0);
                        }}
                        style={{
                            pointerEvents: 'false',
                        }}
                    />
                </div>
            )}

            {/* 상단 정보 */}
            <RoomHeader
                roomName={roomName}
                roomCode={roomCode}
                members={members}
                id={socket.id}
                showCode={showCode}
                setShowCode={setShowCode}
                copyToClipboard={copyToClipboard}
                copied={copied}
                handleLeaveRoom={handleLeaveRoom}
                syncPlayer={syncPlayer}
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
                        <span className="text-muted text-nowrap small">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                        <button className="btn btn-light" onClick={syncPlayer}>
                            <i className="bi bi-record-fill"></i>
                        </button>
                    </div>

                    {/* 가운데: 노래 정보 (임시 텍스트) */}
                    {playlist.length > 0 && (
                        <div className="text-center text-truncate mb-0">
                            <div className="fw-bold text-truncate">{decode(playlist[currentIndex].title)}</div>
                            <div className="text-muted text-truncate small">{decode(playlist[currentIndex].channel)}</div>
                        </div>
                    )}

                    {/* 오른쪽: 음소거 및 볼륨 */}
                    <div className="d-flex align-items-center gap-2">
                        <button className={`btn ${isMuted ? 'btn-dark' : 'btn-light'}`} onClick={toggleMute}>
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
            <div
                className="mt-1 overflow-auto"
                style={{ height: '100%', maxHeight: 'calc(100vh - 225px)' }}
            >
                <Playlist playlist={playlist} currentIndex={currentIndex}/>
            </div>
        </div>
    );
}

export default Room;
