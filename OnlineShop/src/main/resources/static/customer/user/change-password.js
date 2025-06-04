document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded in change-password.js, starting initialization');
    getUserInfo();
});

async function getUserInfo() {
    console.log('Fetching user info started in change-password.js');
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token);
    if (!token || token.trim() === '') {
        console.error('No valid token found in localStorage');
        alert('Vui lòng đăng nhập để đổi mật khẩu!');
        window.location.href = '/customer/login/login.html';
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

        console.log('API Response Status:', response.status);
        if (response.ok) {
            const userInfo = await response.json();
            console.log('User Info Received:', userInfo);
            if (userInfo && userInfo.fullName && userInfo.username) {
                document.getElementById('userInfo').textContent = `Xin chào, ${userInfo.fullName}`;
                // Lưu username vào biến toàn cục để sử dụng trong changePassword
                window.currentUsername = userInfo.username;
            } else {
                console.error('Invalid user info structure:', userInfo);
                document.getElementById('userInfo').textContent = 'Xin chào';
            }
        } else {
            const errorText = await response.text();
            console.error('API Error - Status:', response.status, 'Message:', errorText);
            if (response.status === 401) {
                alert('Token không hợp lệ hoặc hết hạn. Vui lòng đăng nhập lại!');
                window.location.href = '/customer/login/login.html';
            } else {
                alert(`Lỗi khi lấy thông tin người dùng: ${errorText}`);
            }
        }
    } catch (error) {
        console.error('Fetch Error:', error.message);
        alert('Lỗi kết nối đến server. Vui lòng thử lại sau!');
    }
}

async function changePassword() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập để đổi mật khẩu!');
        window.location.href = '/customer/login/login.html';
        return;
    }

    const oldPassword = document.getElementById('old-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Kiểm tra các trường không được để trống
    if (!oldPassword || oldPassword.trim() === '') {
        alert('Mật khẩu cũ không được để trống!');
        return;
    }

    if (!newPassword || newPassword.trim() === '') {
        alert('Mật khẩu mới không được để trống!');
        return;
    }

    if (!confirmPassword || confirmPassword.trim() === '') {
        alert('Xác nhận mật khẩu mới không được để trống!');
        return;
    }

    // Kiểm tra mật khẩu mới và xác nhận mật khẩu có khớp không
    if (newPassword !== confirmPassword) {
        alert('Mật khẩu mới và xác nhận mật khẩu không khớp!');
        return;
    }

    // Kiểm tra mật khẩu cũ bằng cách gọi API đăng nhập
    const username = window.currentUsername; // Lấy username từ biến toàn cục
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
                console.log('Mật khẩu cũ chính xác, tiến hành đổi mật khẩu...');
                // Gọi API đổi mật khẩu
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
                    localStorage.removeItem('token'); // Xóa token
                    window.location.href = '/customer/login/login.html'; // Chuyển hướng về trang đăng nhập
                } else {
                    const errorText = await changePasswordResponse.text();
                    alert(`Lỗi khi đổi mật khẩu: ${errorText}`);
                }
            } else {
                alert('Mật khẩu cũ không chính xác!');
            }
        } else {
            console.error('Login API Error - Status:', loginResponse.status);
            alert('Mật khẩu cũ không chính xác!');
        }
    } catch (error) {
        console.error('Fetch Error:', error.message);
        alert('Lỗi kết nối đến server. Vui lòng thử lại sau!');
    }
}

// Hàm logout sử dụng từ home.js
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/auth/login.html';
}