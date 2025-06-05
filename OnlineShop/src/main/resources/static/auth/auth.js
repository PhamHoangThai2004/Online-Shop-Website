// Hàm hiển thị/ẩn mật khẩu
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const eyeIcon = document.getElementById(inputId + 'EyeIcon');
    if (input.type === 'password') {
        input.type = 'text';
        eyeIcon.classList.remove('fa-eye');
        eyeIcon.classList.add('fa-eye-slash');
        eyeIcon.parentElement.classList.add('active');
    } else {
        input.type = 'password';
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
        eyeIcon.parentElement.classList.remove('active');
    }
}

// Xử lý form đăng nhập
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        try {
            // Gửi yêu cầu đăng nhập
            const loginResponse = await fetch('http://localhost:8080/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const loginText = await loginResponse.text();
            let loginData;
            try {
                loginData = JSON.parse(loginText);
            } catch (e) {
                loginData = { message: loginText };
            }

            if (loginResponse.ok) {
                localStorage.setItem('token', loginData.token); // Lưu token

                // Gọi API để lấy thông tin người dùng (bao gồm role)
                const userInfoResponse = await fetch('http://localhost:8080/api/auth/user/info', {
                    headers: { 'Authorization': `Bearer ${loginData.token}` }
                });

                const userInfoData = await userInfoResponse.json();

                if (userInfoResponse.ok) {
                    const role = userInfoData.role; // Giả sử API trả về role
                    localStorage.setItem('role', role); // Lưu role để sử dụng sau này
                    localStorage.setItem('username', userInfoData.username); // Lưu username (tùy chọn)

                    document.getElementById('loginMessage').textContent = 'Đăng nhập thành công!';
                    document.getElementById('loginMessage').style.color = 'green';

                    // Điều hướng dựa trên vai trò
                    if (role === 'CUSTOMER') {
                        setTimeout(() => window.location.href = '/customer/home/home.html', 1000);
                    } else if (role === 'ADMIN') {
                        setTimeout(() => window.location.href = '/admin/dashboard.html', 1000);
                    } else {
                        document.getElementById('loginMessage').textContent = 'Vai trò không hợp lệ!';
                        document.getElementById('loginMessage').style.color = 'red';
                        localStorage.removeItem('token');
                        localStorage.removeItem('role');
                        localStorage.removeItem('username');
                    }
                } else {
                    document.getElementById('loginMessage').textContent = 'Không thể lấy thông tin người dùng!';
                    document.getElementById('loginMessage').style.color = 'red';
                    localStorage.removeItem('token');
                }
            } else {
                console.log(loginData.message);
                document.getElementById('loginMessage').textContent = 'Tài khoản hoặc mật khẩu không chính xác';
                document.getElementById('loginMessage').style.color = 'red';
            }
        } catch (error) {
            document.getElementById('loginMessage').textContent = 'Lỗi kết nối!';
            document.getElementById('loginMessage').style.color = 'red';
            console.log('Lỗi kết nối:', error);
        }
    });
}

// Xử lý form đăng ký
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;
        const email = document.getElementById('registerEmail').value;
        const fullName = document.getElementById('registerFullName').value || '';
        const phoneNumber = document.getElementById('registerPhoneNumber').value || '';
        const address = document.getElementById('registerAddress').value || '';

        try {
            const response = await fetch('http://localhost:8080/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, email, role: 'CUSTOMER', fullName, phoneNumber, address })
            });

            const text = await response.text();
            let data;
            try {
                data = text ? JSON.parse(text) : {};
            } catch (e) {
                data = { message: text };
            }

            if (response.ok) {
                document.getElementById('registerMessage').textContent = 'Đăng ký thành công!';
                document.getElementById('registerMessage').style.color = 'green';
                setTimeout(() => window.location.href = '/login/login.html', 1000); // Cập nhật đường dẫn tuyệt đối
            } else {
                console.log(data.message);
                document.getElementById('registerMessage').textContent = 'Đăng ký thất bại!';
                document.getElementById('registerMessage').style.color = 'red';
            }
        } catch (error) {
            document.getElementById('registerMessage').textContent = 'Lỗi kết nối!';
            document.getElementById('registerMessage').style.color = 'red';
            console.log('Lỗi kết nối:', error);
        }
    });
}