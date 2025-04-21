import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';

function Lobby() {
    const navigate = useNavigate();

    const [nickname, setNickname] = useState('');
    const [roomTitle, setRoomTitle] = useState('');
    const [inviteCode, setInviteCode] = useState('');

    const [nicknameError, setNicknameError] = useState('');
    const [roomTitleError, setRoomTitleError] = useState('');
    const [inviteCodeError, setInviteCodeError] = useState('');

    // ✅ room-created 이벤트 한 번만 등록
    useEffect(() => {
        const handleRoomCreated = ({ inviteCode }) => {
            navigate(`/room/${inviteCode}`, { state: { nickname } });
        };

        socket.on('room-created', handleRoomCreated);
        return () => socket.off('room-created', handleRoomCreated);
    }, [navigate, nickname]);

    // ✅ 방 생성
    const handleCreateRoom = () => {
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

        socket.emit('create-room', {
            roomName: roomTitle.trim(),
            userName: nickname.trim()
        });
    };

    // ✅ 방 참가
    const handleJoinRoom = () => {
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

        socket.emit(
            'join-room',
            { inviteCode: inviteCode.trim(), userName: nickname.trim() },
            (response) => {
                if (response.success) {
                    navigate(`/room/${inviteCode}`, { state: { nickname } });
                } else {
                    setInviteCodeError(response.message || '방 참가에 실패했습니다.');
                }
            }
        );
    };

    return (
        <div style={{ minHeight: '100vh' }} className="d-flex justify-content-center align-items-center bg-light">
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
