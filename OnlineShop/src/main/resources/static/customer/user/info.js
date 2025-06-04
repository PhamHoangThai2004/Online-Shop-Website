document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded in info.js, starting initialization');
    getUserInfo();
});

async function getUserInfo() {
    console.log('Fetching user info started in info.js');
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token);
    if (!token || token.trim() === '') {
        console.error('No valid token found in localStorage');
        alert('Vui lòng đăng nhập để xem thông tin!');
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
            if (userInfo && typeof userInfo === 'object' && userInfo.username && userInfo.fullName && userInfo.phoneNumber && userInfo.address) {
                document.getElementById('user-username').textContent = userInfo.username || 'Chưa có thông tin';
                document.getElementById('user-full-name').value = userInfo.fullName || 'Chưa có thông tin';
                document.getElementById('user-phone-number').value = userInfo.phoneNumber || 'Chưa có thông tin';
                document.getElementById('user-email').value = userInfo.email || 'Chưa có thông tin';
                document.getElementById('user-address').value = userInfo.address || 'Chưa có thông tin';
                document.getElementById('user-gender').value = userInfo.gender || 'Nam';

                // Xử lý ngày sinh
                let birthdateValue = '';
                if (userInfo.birthday) {
                    const cleanedBirthday = userInfo.birthday.trim();
                    const dateParts = cleanedBirthday.split('/');
                    if (dateParts.length === 3) {
                        const day = dateParts[0].padStart(2, '0');
                        const month = dateParts[1].padStart(2, '0');
                        const year = dateParts[2];
                        birthdateValue = `${year}-${month}-${day}`;
                        console.log('Converted birthdate:', birthdateValue);
                    } else {
                        console.error('Invalid birthday format:', userInfo.birthday);
                    }
                }
                document.getElementById('user-birthdate').value = birthdateValue;

                document.getElementById('userInfo').textContent = `Xin chào, ${userInfo.fullName}`;
            } else {
                console.error('Invalid user info structure:', userInfo);
                alert('Dữ liệu từ API không chứa đầy đủ thông tin.');
                document.getElementById('user-username').textContent = 'Chưa có thông tin';
                document.getElementById('user-full-name').value = 'Chưa có thông tin';
                document.getElementById('user-phone-number').value = 'Chưa có thông tin';
                document.getElementById('user-email').value = 'Chưa có thông tin';
                document.getElementById('user-address').value = 'Chưa có thông tin';
                document.getElementById('user-gender').value = 'Nam';
                document.getElementById('user-birthdate').value = '';
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

// Hàm kiểm tra định dạng email
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Hàm kiểm tra định dạng số điện thoại (10 chữ số, bắt đầu bằng 0)
function validatePhoneNumber(phoneNumber) {
    const phoneRegex = /^0\d{9}$/;
    return phoneRegex.test(phoneNumber);
}

async function saveUserInfo() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập để lưu thông tin!');
        window.location.href = '/customer/login/login.html';
        return;
    }

    const email = document.getElementById('user-email').value;
    const phoneNumber = document.getElementById('user-phone-number').value;
    const fullName = document.getElementById('user-full-name').value;
    const address = document.getElementById('user-address').value;

    // Kiểm tra các trường không được để trống
    if (!fullName || fullName.trim() === '') {
        alert('Tên không được để trống!');
        return;
    }

    if (!address || address.trim() === '') {
        alert('Địa chỉ không được để trống!');
        return;
    }

    // Kiểm tra định dạng email
    if (!validateEmail(email)) {
        alert('Email không hợp lệ! Vui lòng nhập đúng định dạng (ví dụ: example@domain.com).');
        return;
    }

    // Kiểm tra định dạng số điện thoại
    if (!validatePhoneNumber(phoneNumber)) {
        alert('Số điện thoại không hợp lệ! Vui lòng nhập số điện thoại 10 chữ số bắt đầu bằng 0 (ví dụ: 0987654321).');
        return;
    }

    const userInfo = {
        fullName: fullName,
        phoneNumber: phoneNumber,
        email: email,
        address: address,
        gender: document.getElementById('user-gender').value,
        birthday: document.getElementById('user-birthdate').value ? document.getElementById('user-birthdate').value.split('-').reverse().join('/') : null
    };

    try {
        const response = await fetch('http://localhost:8080/api/auth/update', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userInfo)
        });

        if (response.ok) {
            alert('Cập nhật thông tin thành công!');
            getUserInfo(); // Làm mới thông tin
        } else {
            const errorText = await response.text();
            alert(`Lỗi khi cập nhật thông tin: ${errorText}`);
        }
    } catch (error) {
        console.error('Fetch Error:', error.message);
        alert('Lỗi kết nối đến server. Vui lòng thử lại sau!');
    }
}