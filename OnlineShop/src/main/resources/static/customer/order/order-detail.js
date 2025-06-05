const urlParams = new URLSearchParams(window.location.search);

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded in order-detail.js, starting initialization');
    const reviewDialog = document.getElementById('review-dialog');
    const reviewComment = document.getElementById('review-comment');
    console.log('Initial DOM Check - Review Dialog Elements:', { reviewDialog, reviewComment });
    getUserInfo();
    getOrderDetail();
});

async function getUserInfo() {
    console.log('Fetching user info started in order-detail.js');
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token);
    if (!token || token.trim() === '') {
        console.error('No valid token found in localStorage');
        alert('Vui lòng đăng nhập để xem chi tiết đơn hàng!');
        window.location.href = '/auth/login.html';
        return;
    }

    try {
        const response = await fetch('http://localhost:8080/api/auth/user/info', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('API Response Status (getUserInfo):', response.status);
        if (response.ok) {
            const userInfo = await response.json();
            console.log('User Info Received:', userInfo);
            if (userInfo && userInfo.fullName) {
                document.getElementById('userInfo').textContent = `Xin chào, ${userInfo.fullName}`;
            } else {
                console.error('Invalid user info structure:', userInfo);
                document.getElementById('userInfo').textContent = 'Xin chào';
            }
        } else {
            const errorText = await response.text();
            console.error('API Error (getUserInfo) - Status:', response.status, 'Message:', errorText);
            if (response.status === 401) {
                alert('Token không hợp lệ hoặc hết hạn. Vui lòng đăng nhập lại!');
                window.location.href = '/auth/login.html';
            } else {
                alert(`Lỗi khi lấy thông tin người dùng: ${errorText}`);
            }
        }
    } catch (error) {
        console.error('Fetch Error (getUserInfo):', error.message);
        console.error('Error Stack:', error.stack);
        alert('Lỗi kết nối đến server khi lấy thông tin người dùng. Vui lòng kiểm tra server!');
    }
}

async function getOrderDetail() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập để xem chi tiết đơn hàng!');
        window.location.href = '/auth/login.html';
        return;
    }

    const orderId = urlParams.get('orderId');
    if (!orderId) {
        alert('Không tìm thấy mã đơn hàng!');
        window.location.href = '/customer/order/order-list.html';
        return;
    }

    console.log('Token:', token);
    console.log('Order ID:', orderId);
    console.log('Fetching URL:', `http://localhost:8080/api/orders/${orderId}`);

    try {
        const response = await fetch(`http://localhost:8080/api/orders/${orderId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('API Response Status (getOrderDetail):', response.status);
        if (response.ok) {
            const order = await response.json();
            console.log('Order Data:', order);
            displayOrderDetail(order);
        } else {
            const errorText = await response.text();
            console.error('API Error (getOrderDetail) - Status:', response.status, 'Message:', errorText);
            alert(`Lỗi khi lấy chi tiết đơn hàng: ${errorText}`);
            window.location.href = '/customer/order/order-list.html';
        }
    } catch (error) {
        console.error('Fetch Error (getOrderDetail):', error.message);
        console.error('Error Stack:', error.stack);
        alert('Lỗi kết nối đến server khi lấy chi tiết đơn hàng. Vui lòng kiểm tra server!');
        window.location.href = '/customer/order/order-list.html';
    }
}

let currentProductId = null;
let selectedRating = 0;

function displayOrderDetail(order) {
    const reviewHeader = document.getElementById('review-header'); // Đây là phần tử <thead>
    const orderItems = document.getElementById('order-items');
    const actionButtons = document.getElementById('action-buttons');
    console.log('DOM Elements:', { reviewHeader, orderItems, actionButtons });

    document.getElementById('order-id').textContent = order.id;
    document.getElementById('order-date').textContent = new Date(order.createdAt).toLocaleDateString('vi-VN');
    document.getElementById('total-price').textContent = order.totalPrice.toLocaleString('vi-VN') + ' VNĐ';
    document.getElementById('order-status').textContent = order.status;

    if (orderItems) {
        orderItems.innerHTML = '';

        if (order.items && order.items.length === 0) {
            orderItems.innerHTML = `<tr><td colspan="5" style="text-align: center;">Không có sản phẩm nào trong đơn hàng.</td></tr>`;
            return;
        }

        if (order.items) {
            order.items.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.productName || 'Không có tên'}</td>
                    <td>${item.price ? item.price.toLocaleString('vi-VN') + ' VNĐ' : 'N/A'}</td>
                    <td>${item.quantity || 0}</td>
                    <td>${item.price && item.quantity ? (item.price * item.quantity).toLocaleString('vi-VN') + ' VNĐ' : 'N/A'}</td>
                    <td><span class="review-link" onclick="openReviewDialog(${item.productId || 0}, '${order.status}')" style="color: #0c97d3">Đánh giá</span></td>
                `;
                orderItems.appendChild(row);
            });
        }
    }

    if (actionButtons) {
        actionButtons.innerHTML = '';
        if (order.status === 'PENDING') {
            const cancelBtn = document.createElement('button');
            cancelBtn.classList.add('cancel-btn');
            cancelBtn.textContent = 'Hủy Đơn Hàng';
            cancelBtn.onclick = () => cancelOrder(order.id);
            actionButtons.appendChild(cancelBtn);
        } else if (order.status === 'CANCELLED' || order.status === 'SHIPPED') {
            const reorderBtn = document.createElement('button');
            reorderBtn.classList.add('reorder-btn');
            reorderBtn.textContent = 'Mua Lại';
            reorderBtn.onclick = () => reorder(order.items);
            actionButtons.appendChild(reorderBtn);
        }
        const backBtn = document.createElement('button');
        backBtn.classList.add('back-btn');
        backBtn.textContent = 'Quay Lại';
        backBtn.onclick = goBack;
        actionButtons.appendChild(backBtn);
    }
}

function openReviewDialog(productId, orderStatus) {
    currentProductId = productId;
    selectedRating = 0;

    if (orderStatus !== 'SHIPPED') {
        alert('Yêu cầu nhận được hàng mới có thể review!');
        return;
    }

    const reviewComment = document.getElementById('review-comment');
    const reviewDialog = document.getElementById('review-dialog');
    console.log('Review Dialog Elements:', { reviewComment, reviewDialog });

    if (!reviewDialog) {
        alert('Lỗi: Không tìm thấy dialog review!');
        return;
    }

    if (reviewComment) {
        reviewComment.value = '';
    }

    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.classList.remove('selected');
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.getAttribute('data-value'));
            stars.forEach(s => s.classList.remove('selected'));
            for (let i = 0; i < selectedRating; i++) {
                stars[i].classList.add('selected');
            }
        });
    });

    reviewDialog.style.display = 'flex';
}

function closeReviewDialog() {
    const reviewDialog = document.getElementById('review-dialog');
    if (reviewDialog) {
        reviewDialog.style.display = 'none';
    }
    currentProductId = null;
    selectedRating = 0;
}

async function submitReview() {
    if (!currentProductId) {
        alert('Lỗi: Không xác định được sản phẩm để review!');
        return;
    }

    if (selectedRating === 0) {
        alert('Vui lòng chọn số sao để đánh giá!');
        return;
    }

    const comment = document.getElementById('review-comment')?.value.trim();
    if (!comment) {
        alert('Vui lòng nhập bình luận!');
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập để gửi review!');
        window.location.href = '/auth/login.html';
        return;
    }

    let userId;
    try {
        userId = parseInt(await extractIdFromToken(token));
        console.log('Extracted User ID:', userId);
    } catch (error) {
        console.error('Error extracting userId:', error.message);
        alert('Lỗi khi lấy thông tin người dùng. Vui lòng thử lại!');
        return;
    }

    const reviewData = {
        userId: userId,
        rating: selectedRating,
        comment: comment
    };

    try {
        const response = await fetch(`http://localhost:8080/api/products/${currentProductId}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(reviewData)
        });

        console.log('API Response Status (submitReview):', response.status);
        if (response.ok) {
            alert('Gửi review thành công!');
            closeReviewDialog();
        } else {
            const errorText = await response.text();
            console.error('API Error (submitReview) - Status:', response.status, 'Message:', errorText);
            alert(`Lỗi khi gửi review: ${errorText}`);
        }
    } catch (error) {
        console.error('Fetch Error (submitReview):', error.message);
        console.error('Error Stack:', error.stack);
        alert('Lỗi kết nối đến server khi gửi review. Vui lòng kiểm tra server!');
    }
}

async function extractIdFromToken(token) {
    return new Promise((resolve) => {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            resolve(payload.userId || payload.sub || "1"); // Thay 'userId' hoặc 'sub' bằng key thực tế trong token
        } catch (e) {
            console.warn("Could not parse token to extract user ID, returning mock ID '1'. Token:", token, "Error:", e);
            resolve("1"); // Trả về ID giả nếu không parse được
        }
    });
}

async function cancelOrder(orderId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập để hủy đơn hàng!');
        window.location.href = '/auth/login.html';
        return;
    }

    if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:8080/api/orders/${orderId}/cancel`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('API Response Status (cancelOrder):', response.status);
        if (response.ok) {
            alert('Hủy đơn hàng thành công!');
            getOrderDetail(); // Tải lại chi tiết đơn hàng để cập nhật trạng thái
        } else {
            const errorText = await response.text();
            console.error('API Error (cancelOrder) - Status:', response.status, 'Message:', errorText);
            alert(`Lỗi khi hủy đơn hàng: ${errorText}`);
        }
    } catch (error) {
        console.error('Fetch Error (cancelOrder):', error.message);
        console.error('Error Stack:', error.stack);
        alert('Lỗi kết nối đến server khi hủy đơn hàng. Vui lòng kiểm tra server!');
    }
}

async function reorder(items) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập để mua lại đơn hàng!');
        window.location.href = '/auth/login.html';
        return;
    }

    try {
        for (const item of items) {
            // Cần đảm bảo item.productId và item.quantity có sẵn và đúng
            if (typeof item.productId === 'undefined' || typeof item.quantity === 'undefined') {
                console.error('Product ID or quantity is missing for item:', item);
                alert(`Sản phẩm ${item.productName || 'không xác định'} thiếu thông tin để thêm vào giỏ hàng.`);
                continue;
            }
            const response = await fetch(`http://localhost:8080/api/cart/add?productId=${item.productId}&quantity=${item.quantity}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('API Response Status (reorder):', response.status);
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error (reorder) - Status:', response.status, 'Message:', errorText);
                alert(`Lỗi khi thêm sản phẩm ${item.productName || 'không xác định'} vào giỏ hàng: ${errorText}`);
                return; // Dừng nếu có lỗi
            }
        }

        alert('Đã thêm tất cả sản phẩm vào giỏ hàng!');
        window.location.href = '/customer/cart/cart.html';
    } catch (error) {
        console.error('Fetch Error (reorder):', error.message);
        console.error('Error Stack:', error.stack);
        alert('Lỗi kết nối đến server khi mua lại đơn hàng. Vui lòng kiểm tra server!');
    }
}

function goBack() {
    window.location.href = '/customer/order/order-list.html';
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/auth/login.html';
}