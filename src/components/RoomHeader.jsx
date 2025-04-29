import React from 'react';

function RoomHeader({ roomName, roomCode, members, id, showCode, setShowCode, copyToClipboard, copied, handleLeaveRoom }) {
    return(
        <div className="d-flex justify-content-between align-items-center mb-1">
            <div className="dropdown me-2">
                <button
                    className="btn btn-outline-secondary btn-sm dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                >
                    {members.length} <i className="bi bi-people-fill"></i>
                </button>
                <ul className="dropdown-menu">
                    {members.map((member) => (
                        <li key={member.id}>
                            <div className={`dropdown-item d-flex justify-content-between align-items-center ${member.id === id ? 'bg-secondary text-white' : ''}`}>
                                <span>{member.name}</span>
                                {members[0]?.id === member.id && <span className="ms-2">⭐</span>}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="alert alert-light flex-grow-1 d-flex justify-content-between align-items-center mb-0">
                <h4 className="mb-0">{roomName}</h4>
                <div className="alert alert-secondary d-flex align-items-center gap-2 mb-0 py-1 px-2">
                    <span className="text-muted small">Code:</span>
                    <span className="small fw" style={{minWidth: `50px`}}>
                            {showCode ? roomCode : '*'.repeat(roomCode.length)}
                        </span>
                    <button className="btn btn-outline-secondary btn-sm py-0 px-1" onClick={() => setShowCode(!showCode)}>
                        <i className={`bi ${showCode ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                    <button className="btn btn-outline-primary btn-sm py-0 px-1" onClick={copyToClipboard}>
                        <i className="bi bi-clipboard"></i>
                    </button>
                    {copied && (
                        <div className="position-absolute top-100 end-0 translate-middle-x mt-1 px-2 py-1 bg-success text-white rounded small fade show">
                            복사됨!
                        </div>
                    )}
                </div>
            </div>
            <button
                className="btn btn-outline-danger btn-sm ms-2"
                onClick={handleLeaveRoom}
            >
                <i className="bi bi-door-open"></i>
            </button>
        </div>
    );
}

export default RoomHeader;