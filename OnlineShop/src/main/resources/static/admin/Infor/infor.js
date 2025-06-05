const API_BASE_URL = 'http://localhost:8080/api/auth'; // Thay đổi nếu cần

// Hàm đăng xuất
function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html'; // Thay bằng trang đăng nhập của bạn
}

// Lấy thông tin người dùng và điền vào form
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

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Không thể lấy thông tin tài khoản: ${errorText}`;
            if (response.status === 401) {
                errorMessage = 'Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.';
                localStorage.removeItem('token'); // Xóa token không hợp lệ
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
        console.error('Lỗi chi tiết:', error);
        alert(`Đã có lỗi xảy ra: ${error.message}`);
    }
}

// Xử lý cập nhật thông tin người dùng
document.getElementById('updateUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập để cập nhật thông tin');
        return;
    }

    const updateData = {
        fullName: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        phoneNumber: document.getElementById('phoneNumber').value,
        address: document.getElementById('address').value,
        birthday: document.getElementById('birthday').value,
        gender: document.getElementById('gender').value
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
        console.error('Lỗi chi tiết:', error);
        alert(`Đã có lỗi xảy ra: ${error.message}`);
    }
});

// Xử lý thay đổi mật khẩu
document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập để đổi mật khẩu');
        return;
    }

    const passwordData = {
        newPassword: document.getElementById('newPassword').value
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
        document.getElementById('newPassword').value = ''; // Xóa trường mật khẩu
    } catch (error) {
        console.error('Lỗi chi tiết:', error);
        alert(`Đã có lỗi xảy ra: ${error.message}`);
    }
});

// Tải thông tin người dùng khi trang được tải
document.addEventListener('DOMContentLoaded', fetchUserInfo);