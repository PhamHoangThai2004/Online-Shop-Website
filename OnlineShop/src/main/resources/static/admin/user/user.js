const API_BASE_URL = 'http://localhost:8080/api/auth';
const userTableBody = document.getElementById('userTableBody');
const searchInput = document.getElementById('searchInput');

async function fetchAndRenderUsers() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Vui lòng đăng nhập để xem danh sách người dùng');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Không thể lấy dữ liệu người dùng');
        }

        const users = await response.json();
        renderUsers(users);
    } catch (error) {
        console.error('Lỗi:', error);
        alert('Đã có lỗi xảy ra khi lấy danh sách người dùng');
    }
}

function renderUsers(users) {
    const searchTerm = searchInput.value.toLowerCase();

    const filteredUsers = users.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
    );

    userTableBody.innerHTML = '';

    filteredUsers.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.fullName}</td>
            <td>${user.email}</td>
            <td>${user.role}</td>
            <td>
                <button onclick="viewUserDetails(${user.id})">Xem</button>
            </td>
        `;
        userTableBody.appendChild(row);
    });
}

async function viewUserDetails(userId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Vui lòng đăng nhập để xem chi tiết người dùng');
            return;
        }

        window.location.href = `user-detail.html?id=${userId}`;
    } catch (error) {
        console.error('Lỗi:', error);
        alert('Đã có lỗi xảy ra khi chuyển đến trang chi tiết');
    }
}

searchInput.addEventListener('input', () => {
    fetchAndRenderUsers();
});

document.addEventListener('DOMContentLoaded', fetchAndRenderUsers);