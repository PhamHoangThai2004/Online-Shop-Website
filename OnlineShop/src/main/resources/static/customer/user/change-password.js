document.addEventListener('DOMContentLoaded', () => {
    getUserInfo();
    setupPasswordToggles();
});

function setupPasswordToggles() {
    const toggleIcons = document.querySelectorAll('.toggle-password');
    toggleIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            const targetId = icon.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
}

async function getUserInfo() {
    const token = localStorage.getItem('token');
    if (!token || token.trim() === '') {
        alert('Vui lòng đăng nhập để đổi mật khẩu!');
        window.location.href = 'auth/login.html';
        return;
    }

    try {
        const response = await fetch('http://localhost:8080/api/auth/user/info', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const userInfo = await response.json();
            if (userInfo && userInfo.fullName && userInfo.username) {
                document.getElementById('userInfo').textContent = `Xin chào, ${userInfo.fullName}`;
                window.currentUsername = userInfo.username;
            } else {
                document.getElementById('userInfo').textContent = 'Xin chào';
            }
        } else {
            const errorText = await response.text();
            console.error('API Error - Status:', response.status, 'Message:', errorText);
            if (response.status === 401) {
                alert('Token không hợp lệ hoặc hết hạn. Vui lòng đăng nhập lại!');
                window.location.href = '/auth/login.html';
            } else {
                alert(`Lỗi khi lấy thông tin người dùng: ${errorText}`);
            }
        }
    } catch (error) {
        alert('Lỗi kết nối đến server. Vui lòng thử lại sau!');
    }
}

async function changePassword() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập để đổi mật khẩu!');
        window.location.href = 'auth/login.html';
        return;
    }

    const oldPassword = document.getElementById('old-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (!oldPassword || oldPassword.trim() === '') {
        alert('Mật khẩu cũ không được để trống!');
        return;
    }

    if (!newPassword || newPassword.trim().length < 8) {
        alert('Mật khẩu mới phải có ít nhất 8 kí tự');
        return;
    }

    if (!confirmPassword || confirmPassword.trim() === '') {
        alert('Xác nhận mật khẩu mới không được để trống!');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('Mật khẩu mới và xác nhận mật khẩu không khớp!');
        return;
    }

    const username = window.currentUsername;
    if (!username) {
        alert('Không thể lấy thông tin người dùng. Vui lòng thử lại!');
        return;
    }

    try {
        const loginResponse = await fetch('http://localhost:8080/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: oldPassword
            })
        });

        if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            if (loginData.token) {
                const passwordChangeRequest = {
                    newPassword: newPassword
                };

                const changePasswordResponse = await fetch('http://localhost:8080/api/auth/change-password', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(passwordChangeRequest)
                });

                if (changePasswordResponse.ok) {
                    alert('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
                    localStorage.removeItem('token');
                    window.location.href = '/auth/login.html';
                } else {
                    const errorText = await changePasswordResponse.text();
                    alert(`Lỗi khi đổi mật khẩu: ${errorText}`);
                }
            } else {
                alert('Mật khẩu cũ không chính xác!');
            }
        } else {
            alert('Mật khẩu cũ không chính xác!');
        }
    } catch (error) {
        alert('Lỗi kết nối đến server. Vui lòng thử lại sau!');
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/auth/login.html';
}