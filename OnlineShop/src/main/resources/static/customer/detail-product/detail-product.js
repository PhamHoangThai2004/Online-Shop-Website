// Lấy product.id từ URL parameter
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

async function fetchProductDetail() {
    try {
        const [productResponse, reviewsResponse] = await Promise.all([
            fetch(`http://localhost:8080/api/products/${productId}`),
            fetch(`http://localhost:8080/api/products/${productId}/reviews`)
        ]);
        if (productResponse.ok && reviewsResponse.ok) {
            const product = await productResponse.json();
            let reviews = await reviewsResponse.json();

            const userPromises = reviews.map(review =>
                fetch(`http://localhost:8080/api/auth/users/${review.userId}`)
                    .then(res => res.ok ? res.json() : Promise.reject('Không lấy được thông tin người dùng'))
                    .then(user => ({ ...review, fullName: user.fullName || 'Người dùng không xác định' }))
                    .catch(error => {
                        console.log(`Lỗi lấy thông tin người dùng ${review.userId}:`, error);
                        return { ...review, fullName: 'Người dùng không xác định' };
                    })
            );
            reviews = await Promise.all(userPromises);

            const averageRating = reviews.length > 0
                ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
                : 0;
            displayProductDetail(product, reviews, averageRating);
        } else {
            console.log('Lỗi lấy chi tiết sản phẩm hoặc review:', await productResponse.text(), await reviewsResponse.text());
            document.getElementById('product-detail').innerHTML = '<p>Không tìm thấy sản phẩm hoặc review.</p>';
        }
    } catch (error) {
        console.log('Lỗi kết nối khi lấy chi tiết sản phẩm hoặc review:', error);
        document.getElementById('product-detail').innerHTML = '<p>Lỗi kết nối.</p>';
    }
}

function displayProductDetail(product, reviews, averageRating) {
    const detailDiv = document.getElementById('product-detail');
    const formattedPrice = product.price ? `đ${product.price.toLocaleString('vi-VN')}` : 'N/A'; // Sửa bỏ chữ 'Giá:'
    const formattedSalePrice = product.salePrice ? `đ${product.salePrice.toLocaleString('vi-VN')}` : null;

    // Lưu thông tin product vào biến toàn cục để sử dụng trong addToCart
    console.log('Product từ API:', product); // Kiểm tra product
    window.currentProduct = product;

    // Tính phần trăm giảm giá nếu salePrice tồn tại
    let discountPercentageHtml = '';
    if (formattedSalePrice && product.price && product.salePrice !== null && product.price > 0) { // Đảm bảo price > 0 để tránh chia cho 0
        const discount = product.price - product.salePrice;
        const percentage = ((discount / product.price) * 100);
        if (percentage > 0) { // Chỉ hiển thị nếu có giảm giá thực sự
            discountPercentageHtml = `<span class="discount-percentage">-${percentage.toFixed(0)}%</span>`;
        }
    }

    // Hiển thị hình ảnh
    const defaultImage = 'https://d1hjkbq40fs2x4.cloudfront.net/2016-01-31/files/1045.jpg';
    let mainImageSrc = defaultImage;
    let thumbnailsHtml = '';

    // Nếu có product.images, lấy hình ảnh đầu tiên làm hình ảnh lớn
    if (Array.isArray(product.images) && product.images.length > 0) {
        mainImageSrc = product.images[0].url || defaultImage;
        thumbnailsHtml = product.images.map((img, index) =>
            `<img src="${img.url || defaultImage}" alt="${product.name} thumbnail ${index}" class="thumbnail-image" onclick="changeMainImage('${img.url || defaultImage}')" onerror="this.src='${defaultImage}'">`
        ).join('');
    } else if (product.imageUrl) {
        mainImageSrc = product.imageUrl || defaultImage;
        thumbnailsHtml = `<img src="${product.imageUrl || defaultImage}" alt="${product.name} thumbnail" class="thumbnail-image" onclick="changeMainImage('${product.imageUrl || defaultImage}')" onerror="this.src='${defaultImage}'">`;
    }

    // Hiển thị thông tin sản phẩm
    const descriptionParagraphs = product.description
        ? product.description.split('\n').filter(Boolean).map(line => `<p style="margin-top: 10px">${line || 'Chưa có mô tả'}</p>`).join('')
        : '<p>Chưa có mô tả</p>';

    const reviewItems = reviews.length > 0
        ? reviews.map(review => {
            const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating); // Tạo sao dựa trên rating
            const dateTime = new Date(review.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            const comment = review.comment || 'Không có bình luận';
            return `
                <div class="review-item">
                    <div class="review-header">
                        <span class="review-user">${review.fullName}</span>
                        <span class="review-date">${dateTime}</span>
                    </div>
                    <div class="review-rating">${stars}</div>
                    <p class="review-comment">${comment}</p>
                </div>
            `;
        }).join('')
        : '<p>Chưa có đánh giá nào.</p>';

    const reviewCount = reviews.length; // Tổng số đánh giá

    const detailHtml = `
        <div class="product-container">
            <div class="image-section">
                <div class="main-image">
                    <img id="mainImage" src="${mainImageSrc}" alt="${product.name}" class="product-image" onerror="this.src='${defaultImage}'">
                </div>
                <div class="thumbnail-section">
                    ${thumbnailsHtml || `<img src="${defaultImage}" alt="${product.name} thumbnail" class="thumbnail-image" onclick="changeMainImage('${defaultImage}')">`}
                </div>
            </div>
            <div class="info-section">
                <h2>${product.name}</h2>
                <div class="price-rating">
                    ${formattedSalePrice ? `
                        <div class="price-group">
                            <span class="original-price">${formattedPrice}</span>
                            ${discountPercentageHtml}
                        </div>
                        <p class="sale-price">${formattedSalePrice}</p>
                    ` : `
                        <p class="regular-price">${formattedPrice}</p>
                    `}
                    <div class="rating-sold-info">
                        <span class="rating-number"><i class="fa fa-star"></i> ${averageRating}</span>
                        <span class="sold-quantity">Đã bán: ${product.soldQuantity || 0}</span>
                    </div>
                </div>
                <div class="product-info-panel">
                    <h3>CHI TIẾT SẢN PHẨM</h3>
                    <div class="info-item"><strong>Danh mục:</strong> <span>${product.categoryName || 'Chưa có thông tin'}</span></div>
                    <div class="info-item"><strong>Số lượng trong kho:</strong> <span>${product.stock || 0}</span></div>
                    <div class="info-item"><strong>Thương hiệu:</strong> <span>${product.brand || 'Chưa có thông tin'}</span></div>
                    <div class="info-item"><strong>Xuất xứ:</strong> <span>${product.origin || 'Chưa có thông tin'}</span></div>
                    <div class="info-item"><strong>Thời gian giao hàng:</strong> <span>1 tuần</span></div>
                    <div class="info-item"><strong>Gửi từ:</strong> <span>Hà Nội</span></div>
                </div>
                <div class="quantity-section">
                    <label for="quantity">Số Lượng</label>
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="decreaseQuantity()">-</button>
                        <input type="number" id="quantity" value="1" min="1" readonly>
                        <button class="quantity-btn" onclick="increaseQuantity()">+</button>
                    </div>
                </div>
                <div class="action-buttons">
                    <button class="add-to-cart" onclick="addToCart(${product.id})"><i class="fa fa-shopping-cart"></i> Thêm Vào Giỏ Hàng</button>
                    <button class="buy-now" onclick="buyNow(${product.id})">Mua Ngay</button>
                </div>
            </div>
        </div>
        <div class="product-description">
            <h3>MÔ TẢ SẢN PHẨM</h3>
            ${descriptionParagraphs}
        </div>
        <div class="reviews-panel">
            <h3>Đánh giá từ người dùng <span class="review-count">(${reviewCount} đánh giá)</span></h3>
            ${reviewItems}
        </div>
    `;
    detailDiv.innerHTML = detailHtml;
}

// Hàm thay đổi hình ảnh lớn khi nhấn vào thumbnail
function changeMainImage(imageUrl) {
    const mainImage = document.getElementById('mainImage');
    mainImage.src = imageUrl;
    // Thêm hoặc xóa class 'active' cho thumbnail
    document.querySelectorAll('.thumbnail-image').forEach(thumb => {
        if (thumb.src === imageUrl) {
            thumb.classList.add('active');
        } else {
            thumb.classList.remove('active');
        }
    });
}


async function addToCart(productId) {
    const quantity = parseInt(document.getElementById('quantity').value);
    const product = window.currentProduct; // Lấy thông tin sản phẩm từ biến toàn cục

    if (!product) {
        alert('Không tìm thấy thông tin sản phẩm!');
        return;
    }

    // Tính tổng tiền
    const priceToUse = product.salePrice !== null && product.salePrice !== undefined ? product.salePrice : product.price;
    const totalPrice = priceToUse * quantity;
    const formattedTotalPrice = `đ${totalPrice.toLocaleString('vi-VN')}`;

    // Hiển thị thông báo xác nhận
    const confirmMessage = `Bạn có muốn thêm "${product.name}" (x${quantity}) với tổng tiền ${formattedTotalPrice} vào giỏ hàng không?`;
    const userConfirmed = confirm(confirmMessage);

    if (userConfirmed) {
        const token = localStorage.getItem('token');
        console.log('Token:', token); // Kiểm tra token
        if (!token) {
            alert('Vui lòng đăng nhập để thêm vào giỏ hàng!');
            return;
        }
        try {
            const response = await fetch(`http://localhost:8080/api/cart/add?productId=${productId}&quantity=${quantity}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Phản hồi API:', response.status); // Kiểm tra phản hồi API
            if (response.ok) {
                alert('Thêm vào giỏ hàng thành công!');
                // Cập nhật số lượng giỏ hàng trên navbar nếu có hàm updateCartCount
                if (typeof window.updateCartCount === 'function') {
                    window.updateCartCount();
                }
                // Điều hướng đến trang giỏ hàng sau khi thêm thành công
                window.location.href = '/customer/cart/cart.html';
            } else {
                let errorMessage = 'Lỗi không xác định khi thêm vào giỏ hàng.';
                if (response.status === 401) {
                    errorMessage = 'Token không hợp lệ hoặc hết hạn. Vui lòng đăng nhập lại!';
                } else if (response.status === 404) {
                    errorMessage = 'Sản phẩm hoặc người dùng không tồn tại.';
                } else if (response.status === 400) {
                    // Cố gắng đọc thông báo lỗi từ server nếu có
                    const errorData = await response.json();
                    errorMessage = errorData.message || 'Số lượng không hợp lệ hoặc vượt quá tồn kho.';
                } else {
                    errorMessage = `Lỗi: ${response.status} - ${response.statusText}`;
                }
                alert(errorMessage);
            }
        } catch (error) {
            console.log('Lỗi kết nối khi thêm vào giỏ hàng:', error);
            alert('Lỗi kết nối. Vui lòng thử lại sau!');
        }
    }
}

function decreaseQuantity() {
    const quantityInput = document.getElementById('quantity');
    let quantity = parseInt(quantityInput.value);
    if (quantity > 1) {
        quantityInput.value = quantity - 1;
    }
}

function increaseQuantity() {
    const quantityInput = document.getElementById('quantity');
    let quantity = parseInt(quantityInput.value);
    const maxStock = window.currentProduct ? window.currentProduct.stock : Infinity; // Lấy tồn kho tối đa
    if (quantity < maxStock) { // Giới hạn không vượt quá tồn kho
        quantityInput.value = quantity + 1;
    } else {
        alert(`Số lượng không thể vượt quá ${maxStock} sản phẩm trong kho!`);
    }
}

function buyNow(productId) {
    const quantity = parseInt(document.getElementById('quantity').value);
    const product = window.currentProduct;
    if (!product) {
        alert('Không tìm thấy thông tin sản phẩm!');
        return;
    }

    const priceToUse = product.salePrice !== null && product.salePrice !== undefined ? product.salePrice : product.price;
    const totalPrice = priceToUse * quantity;
    const formattedTotalPrice = `đ${totalPrice.toLocaleString('vi-VN')}`;

    const confirmMessage = `Bạn có muốn mua ngay "${product.name}" (x${quantity}) với tổng tiền ${formattedTotalPrice} không?`;
    const userConfirmed = confirm(confirmMessage);

    if (userConfirmed) {
        // Đây là nơi bạn sẽ thêm logic chuyển hướng đến trang thanh toán
        // Ví dụ: window.location.href = `/customer/checkout/checkout.html?productId=${productId}&quantity=${quantity}`;
        alert(`Chuyển hướng đến trang thanh toán cho "${product.name}" (x${quantity})! (Chức năng này cần được phát triển)`);
    }
}

// Khởi chạy khi trang load
document.addEventListener('DOMContentLoaded', () => {
    if (productId) {
        fetchProductDetail();
    } else {
        document.getElementById('product-detail').innerHTML = '<p>Không có ID sản phẩm.</p>';
    }
});