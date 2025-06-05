const API_BASE_URL = 'http://localhost:8080/api/auth'; // Thay đổi nếu cần
const userTableBody = document.getElementById('userTableBody');
const searchInput = document.getElementById('searchInput');

async function fetchAndRenderUsers() {
    try {
        // Lấy token từ localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Vui lòng đăng nhập để xem danh sách người dùng');
            return;
        }

        // Gọi API để lấy danh sách người dùng
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

    // Lọc người dùng theo tên hoặc email
    const filteredUsers = users.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
    );

    // Xóa nội dung bảng hiện tại
    userTableBody.innerHTML = '';

    // Render dữ liệu người dùng
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

// Xem chi tiết người dùng
async function viewUserDetails(userId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Vui lòng đăng nhập để xem chi tiết người dùng');
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
        // Hiển thị chi tiết người dùng (có thể mở modal hoặc chuyển trang)
        alert(`
            ID: ${user.id}
            Tên: ${user.fullName}
            Email: ${user.email}
            Vai trò: ${user.role}
            Số điện thoại: ${user.phoneNumber || 'N/A'}
            Địa chỉ: ${user.address || 'N/A'}
            Ngày sinh: ${user.birthday || 'N/A'}
            Giới tính: ${user.gender || 'N/A'}
        `);
    } catch (error) {
        console.error('Lỗi:', error);
        alert('Đã có lỗi xảy ra khi xem chi tiết người dùng');
    }
}

// Gắn sự kiện tìm kiếm
searchInput.addEventListener('input', () => {
    fetchAndRenderUsers();
});

// Tải danh sách người dùng khi trang được tải
document.addEventListener('DOMContentLoaded', fetchAndRenderUsers);