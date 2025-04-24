import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Lobby() {
    const navigate = useNavigate();

    const [nickname, setNickname] = useState('');
    const [roomTitle, setRoomTitle] = useState('');
    const [inviteCode, setInviteCode] = useState('');

    const [nicknameError, setNicknameError] = useState('');
    const [roomTitleError, setRoomTitleError] = useState('');
    const [inviteCodeError, setInviteCodeError] = useState('');

    // ✅ 방 생성
    const handleCreateRoom = async () => {
        let hasError = false;

        if (!nickname.trim()) {
            setNicknameError('닉네임을 입력해주세요.');
            hasError = true;
        } else {
            setNicknameError('');
        }

        if (!roomTitle.trim()) {
            setRoomTitleError('방 제목을 입력해주세요.');
            hasError = true;
        } else {
            setRoomTitleError('');
        }

        if (hasError) return;

        try {
            const res = await fetch('http://localhost:3001/room/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomTitle: roomTitle.trim() })
            });

            const data = await res.json();
            if (data.success) {
                navigate(`/room/${data.inviteCode}`, { state: { nickname } });
            }
        } catch (err) {
            console.error('방 생성 실패:', err);
        }
    };

    // ✅ 방 참가
    const handleJoinRoom = async () => {
        let hasError = false;

        if (!nickname.trim()) {
            setNicknameError('닉네임을 입력해주세요.');
            hasError = true;
        } else {
            setNicknameError('');
        }

        if (!inviteCode.trim()) {
            setInviteCodeError('방 코드를 입력해주세요.');
            hasError = true;
        } else {
            setInviteCodeError('');
        }

        if (hasError) return;

        try {
            const res = await fetch('http://localhost:3001/room/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomCode: inviteCode.trim(),
                    userName: nickname.trim()
                })
            });

            const data = await res.json();
            if (data.success) {
                navigate(`/room/${inviteCode}`, { state: { nickname } });
            } else {
                setInviteCodeError(data.message || '방 참가에 실패했습니다.');
            }
        } catch (err) {
            console.error('방 참가 실패:', err);
            setInviteCodeError('서버 오류로 방 참가에 실패했습니다.');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, red, orange, yellow, green, blue, indigo, violet)',
            backgroundSize: '200% 200%',
            animation: 'gradientFlow 10s ease infinite'
        }} className="d-flex justify-content-center align-items-center bg-light">
            <div className="p-5 bg-white shadow rounded" style={{ width: 500 }}>
                <h2 className="text-center mb-4">
                    <i className="bi bi-music-note-beamed me-2" />로비
                </h2>

                {/* 닉네임 입력 */}
                <div className="mb-4">
                    <input
                        type="text"
                        className={`form-control ${nicknameError ? 'is-invalid' : ''}`}
                        placeholder="닉네임 입력"
                        value={nickname}
                        onChange={(e) => {
                            setNickname(e.target.value);
                            if (nicknameError) setNicknameError('');
                        }}
                    />
                    <div className="text-danger mt-1" style={{ minHeight: '1.2em' }}>
                        {nicknameError}
                    </div>
                </div>

                {/* 참가/생성 쌍 */}
                <div className="d-flex gap-3 align-items-end">
                    {/* 왼쪽: 방 참가 */}
                    <div className="flex-grow-1 d-flex flex-column">
                        <input
                            type="text"
                            className={`form-control mb-2 ${inviteCodeError ? 'is-invalid' : ''}`}
                            placeholder="방 코드 입력"
                            value={inviteCode}
                            onChange={(e) => {
                                setInviteCode(e.target.value);
                                if (inviteCodeError) setInviteCodeError('');
                            }}
                        />
                        <button className="btn btn-primary w-100" onClick={handleJoinRoom}>
                            참가하기
                        </button>
                        <div className="text-danger mt-1" style={{ minHeight: '1.2em' }}>
                            {inviteCodeError}
                        </div>
                    </div>

                    {/* 오른쪽: 방 생성 */}
                    <div className="flex-grow-1 d-flex flex-column">
                        <input
                            type="text"
                            className={`form-control mb-2 ${roomTitleError ? 'is-invalid' : ''}`}
                            placeholder="방 제목 입력"
                            value={roomTitle}
                            onChange={(e) => {
                                setRoomTitle(e.target.value);
                                if (roomTitleError) setRoomTitleError('');
                            }}
                        />
                        <button className="btn btn-success w-100" onClick={handleCreateRoom}>
                            생성하기
                        </button>
                        <div className="text-danger mt-1" style={{ minHeight: '1.2em' }}>
                            {roomTitleError}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Lobby;
