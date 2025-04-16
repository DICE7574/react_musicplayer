import React, { useRef, useState, useEffect } from 'react';
import YouTube from 'react-youtube';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function App() {
    const youtubeId = "0RkX1mBIjRA";
    const youtubeListID = "PLeSslQPAX32g8skK9TpiAJWqtobywviTp";
    const playerRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.2);
    const [isMuted, setIsMuted] = useState(false);
    const [repeatMode, setRepeatMode] = useState("none"); // none, one, all

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

        if (isPlaying) {
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
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
        if (playerRef.current) {
            playerRef.current.setVolume(newVolume * 100);
        }
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
        if (playerRef.current) {
            if (isMuted) {
                playerRef.current.unMute();
                playerRef.current.setVolume(volume * 100);
            } else {
                playerRef.current.mute();
            }
        }
    };

    const toggleRepeatMode = () => {
        const nextMode = repeatMode === "none" ? "one" : repeatMode === "one" ? "all" : "none";
        setRepeatMode(nextMode);

        if (playerRef.current) {
            if (nextMode === "one") {
                playerRef.current.setLoop(true);
            } else {
                playerRef.current.setLoop(false);
            }
        }
    };

    const playPrevious = () => {
        if (!playerRef.current) return;

        const current = playerRef.current.getCurrentTime();
        if (current > 5) {
            playerRef.current.seekTo(0, true);
        } else {
            playerRef.current.previousVideo();
        }
    };

    const playNext = () => {
        if (!playerRef.current) return;

        playerRef.current.nextVideo();
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

    const getRepeatIcon = () => {
        if (repeatMode === "one") return "bi-repeat-1";
        if (repeatMode === "all") return "bi-repeat";
        return "bi-repeat"; // none 상태에서 bi-repeat로 변경
    };

    const getRepeatButtonClass = () => {
        return repeatMode === "none" ? "btn-dark" : "btn-info";
    };

    return (
        <div className="container mt-4">
            <YouTube
                videoId={youtubeId}
                opts={{
                    width: "0",
                    height: "0",
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

                <div className="d-flex justify-content-center gap-3">
                    <button className="btn btn-outline-secondary" onClick={playPrevious}>
                        <i className="bi bi-skip-backward-fill"></i>
                    </button>

                    <button className="btn btn-primary" onClick={togglePlayPause}>
                        <i className={`bi ${isPlaying ? "bi-pause-fill" : "bi-play-fill"}`}></i>
                    </button>

                    <button className="btn btn-outline-secondary" onClick={playNext}>
                        <i className="bi bi-skip-forward-fill"></i>
                    </button>

                    <button className="btn btn-light" onClick={toggleMute}>
                        <i className={`bi ${isMuted ? "bi-volume-mute" : "bi-volume-up"}`}></i>
                    </button>

                    <div className="d-flex align-items-center gap-2">
                        <input
                            type="range"
                            className="form-range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={handleVolumeChange}
                            style={{ width: "80px" }}
                        />
                    </div>

                    <button className={`btn ${getRepeatButtonClass()}`} onClick={toggleRepeatMode}>
                        <i className={`bi ${getRepeatIcon()}`}></i>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default App;
