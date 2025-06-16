const API_BASE_URL = 'http://localhost:8080/api/auth';

// Regex
const passwordRegex = /^.{8,}$/; // Ít nhất 8 ký tự
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Email cơ bản (ví dụ: user@example.com)
const phoneRegex = /^(0|\+84)[0-9]{9,10}$/; // Số điện thoại Việt Nam (bắt đầu 0 hoặc +84, 9-10 số)

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

async function fetchUserInfo() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Vui lòng đăng nhập để xem thông tin tài khoản');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/user/info`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Không thể lấy thông tin tài khoản: ${errorText}`;
            if (response.status === 401) {
                errorMessage = 'Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.';
                localStorage.removeItem('token');
            } else if (response.status === 404) {
                errorMessage = 'API không tồn tại. Vui lòng kiểm tra server.';
            } else if (response.status === 500) {
                errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
            }
            throw new Error(errorMessage);
        }

        const user = await response.json();
        document.getElementById('fullName').value = user.fullName || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('phoneNumber').value = user.phoneNumber || '';
        document.getElementById('address').value = user.address || '';
        document.getElementById('birthday').value = user.birthday || '';
        document.getElementById('gender').value = user.gender || '';
    } catch (error) {
        alert(`Đã có lỗi xảy ra: ${error.message}`);
    }
}

document.getElementById('updateUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập để cập nhật thông tin');
        return;
    }

    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const address = document.getElementById('address').value.trim();
    const birthday = document.getElementById('birthday').value;
    const gender = document.getElementById('gender').value;

    // Kiểm tra các trường không được để trống
    if (!fullName) {
        alert('Họ và tên không được để trống!');
        return;
    }
    if (!email) {
        alert('Email không được để trống!');
        return;
    }
    if (!phoneNumber) {
        alert('Số điện thoại không được để trống!');
        return;
    }
    if (!address) {
        alert('Địa chỉ không được để trống!');
        return;
    }
    if (!birthday) {
        alert('Ngày sinh không được để trống!');
        return;
    }
    if (!gender) {
        alert('Giới tính không được để trống!');
        return;
    }

    // Kiểm tra regex
    if (!emailRegex.test(email)) {
        alert('Email không hợp lệ! Vui lòng nhập đúng định dạng (ví dụ: user@example.com)');
        return;
    }
    if (!phoneRegex.test(phoneNumber)) {
        alert('Số điện thoại không hợp lệ! Vui lòng nhập đúng định dạng (bắt đầu 0 hoặc +84, 9-10 số)');
        return;
    }

    const updateData = {
        fullName,
        email,
        phoneNumber,
        address,
        birthday,
        gender
    };

    try {
        const response = await fetch(`${API_BASE_URL}/update`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Không thể cập nhật thông tin: ${errorText}`;
            if (response.status === 401) {
                errorMessage = 'Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.';
                localStorage.removeItem('token');
            }
            throw new Error(errorMessage);
        }

        alert('Cập nhật thông tin thành công');
    } catch (error) {
        alert(`Đã có lỗi xảy ra: ${error.message}`);
    }
});

document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập để đổi mật khẩu');
        return;
    }

    const newPassword = document.getElementById('newPassword').value.trim();

    // Kiểm tra regex cho mật khẩu
    if (!newPassword) {
        alert('Mật khẩu mới không được để trống!');
        return;
    }
    if (!passwordRegex.test(newPassword)) {
        alert('Mật khẩu phải có ít nhất 8 ký tự!');
        return;
    }

    const passwordData = {
        newPassword
    };

    try {
        const response = await fetch(`${API_BASE_URL}/change-password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(passwordData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Không thể đổi mật khẩu: ${errorText}`;
            if (response.status === 401) {
                errorMessage = 'Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.';
                localStorage.removeItem('token');
            }
            throw new Error(errorMessage);
        }

        alert('Đổi mật khẩu thành công');
        document.getElementById('newPassword').value = '';
    } catch (error) {
        alert(`Đã có lỗi xảy ra: ${error.message}`);
    }
});

document.addEventListener('DOMContentLoaded', fetchUserInfo);