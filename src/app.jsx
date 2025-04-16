import React, { useRef, useState, useEffect } from 'react';
import YouTube from 'react-youtube';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function App() {
    const youtubeId = "N6DMXNyvAxs"; // 유튜브 영상 ID
    const playerRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.2);  // 초기 볼륨 20%
    const [isMuted, setIsMuted] = useState(false);
    const [isLooping, setIsLooping] = useState(false);

    const onReady = (event) => {
        playerRef.current = event.target;
        setDuration(event.target.getDuration());
        event.target.setVolume(volume * 100);
    };

    const togglePlayPause = () => {
        if (!playerRef.current) return;

        if (isPlaying) {
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
        setIsPlaying(!isPlaying);
    };

    const stop = () => {
        if (playerRef.current) {
            playerRef.current.stopVideo();
            setIsPlaying(false);
        }
    };

    const handleSeek = (e) => {
        const newTime = parseFloat(e.target.value);
        playerRef.current.seekTo(newTime, true);
        setCurrentTime(newTime);
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (playerRef.current) {
            playerRef.current.setVolume(newVolume * 100);
        }
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
        if (playerRef.current) {
            if (isMuted) {
                playerRef.current.unMute();
                playerRef.current.setVolume(volume * 100);  // 볼륨 복원
            } else {
                playerRef.current.mute();
            }
        }
    };

    const toggleLoop = () => {
        setIsLooping(!isLooping);
        if (isLooping) {
            playerRef.current.setLoop(false);  // 반복 해제
        } else {
            playerRef.current.setLoop(true);  // 반복 설정
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if (playerRef.current && isPlaying) {
                setCurrentTime(playerRef.current.getCurrentTime());
            }
        }, 500);
        return () => clearInterval(interval);
    }, [isPlaying]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className="container mt-4">
            {/* 유튜브 영상 */}
            <YouTube
                videoId={youtubeId}
                opts={{
                    width: "0",
                    height: "0",
                    playerVars: { autoplay: 0 },
                }}
                onReady={onReady}
                onEnd={() => {
                    if (isLooping && playerRef.current) {
                        playerRef.current.playVideo(); // 반복 모드일 때 비디오가 끝나면 다시 재생
                    }
                }}
                style={{ pointerEvents: 'none' }}
            />

            <div className="card p-4 mt-3 shadow-sm">
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
                    <span style={{ minWidth: 80 }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
                </div>

                {/* 컨트롤 버튼 */}
                <div className="d-flex justify-content-center gap-3">
                    <button className="btn btn-primary" onClick={togglePlayPause}>
                        <i className={`bi ${isPlaying ? "bi-pause-fill" : "bi-play-fill"}`}></i>
                    </button>
                    <button className="btn btn-danger" onClick={stop}>
                        <i className="bi bi-stop-fill"></i>
                    </button>

                    {/* 볼륨 조절 */}
                    <button className="btn btn-light" onClick={toggleMute}>
                        <i className={`bi ${isMuted ? "bi-volume-mute" : "bi-volume-up"}`}></i>
                    </button>

                    <div className="d-flex align-items-center gap-2">
                        <input
                            type="range"
                            className="form-range custom-range-red"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={handleVolumeChange}
                            style={{ width: "80px" }}
                        />
                    </div>

                    {/* 반복 재생 버튼 */}
                    <button
                        className={`btn ${isLooping ? "btn-info" : "btn-dark"}`}
                        onClick={toggleLoop}
                    >
                        <i className="bi bi-repeat"></i>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default App;
