const API_BASE_URL = 'http://localhost:8080/api/auth';

const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('id');

async function fetchAndRenderUserDetails() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Vui lòng đăng nhập để xem chi tiết người dùng');
            window.location.href = 'user.html';
            return;
        }

        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Không thể lấy thông tin người dùng');
        }

        const user = await response.json();
        document.getElementById('userId').textContent = user.id || 'N/A';
        document.getElementById('fullName').textContent = user.fullName || 'N/A';
        document.getElementById('email').textContent = user.email || 'N/A';
        document.getElementById('role').textContent = user.role || 'N/A';
        document.getElementById('phoneNumber').textContent = user.phoneNumber || 'N/A';
        document.getElementById('address').textContent = user.address || 'N/A';
        document.getElementById('birthday').textContent = user.birthday || 'N/A';
        document.getElementById('gender').textContent = user.gender || 'N/A';
    } catch (error) {
        console.error('Lỗi:', error);
        alert('Đã có lỗi xảy ra khi lấy thông tin chi tiết người dùng');
    }
}

document.addEventListener('DOMContentLoaded', fetchAndRenderUserDetails);