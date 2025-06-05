const API_BASE_URL = 'http://localhost:8080/api/products';
const updateProductForm = document.getElementById('updateProductForm');
const categorySelect = document.getElementById('category');
const imagePreview = document.getElementById('imagePreview');
const imageUpload = document.getElementById('imageUpload');
let categoriesData = [];
let currentImages = []; // Lưu ảnh hiện tại

// Cấu hình Cloudinary (lấy từ product.js)
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dvzqdq4my/image/upload';
const CLOUDINARY_UPLOAD_PRESET = 'online_shop';

async function fetchCategories() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Vui lòng đăng nhập để lấy danh sách danh mục');
            return [];
        }

        const response = await fetch('http://localhost:8080/api/categories', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Không thể lấy danh sách danh mục: ${await response.text()}`);
        }

        const categories = await response.json();
        console.log('Categories Data:', categories);
        categoriesData = categories;
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id.toString();
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
        return categories;
    } catch (error) {
        console.error('Lỗi:', error);
        alert(`Đã có lỗi xảy ra: ${error.message}`);
        return [];
    }
}

async function fetchAndPopulateProduct() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        alert('Không tìm thấy ID sản phẩm');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Vui lòng đăng nhập để chỉnh sửa sản phẩm');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/${productId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Không thể lấy chi tiết sản phẩm: ${await response.text()}`);
        }

        const product = await response.json();
        console.log('Product Data:', product);

        document.getElementById('id').value = product.id;
        document.getElementById('name').value = product.name;
        document.getElementById('price').value = product.price;
        document.getElementById('salePrice').value = product.salePrice || '';
        document.getElementById('description').value = product.description || '';
        document.getElementById('stock').value = product.stock;
        document.getElementById('brand').value = product.brand || '';
        document.getElementById('origin').value = product.origin || '';

        const categoryId = categoriesData.find(cat => cat.name === product.categoryName)?.id;
        document.getElementById('category').value = categoryId ? categoryId.toString() : '';

        currentImages = product.images || [];
        updateImagePreview();
    } catch (error) {
        console.error('Lỗi:', error);
        alert(`Đã có lỗi xảy ra: ${error.message}`);
    }
}

function updateImagePreview() {
    imagePreview.innerHTML = '';
    currentImages.forEach(image => {
        const img = document.createElement('img');
        img.src = image.url;
        img.alt = `Ảnh sản phẩm`;
        imagePreview.appendChild(img);
    });
    const files = imageUpload.files;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = `Ảnh mới ${i + 1}`;
            imagePreview.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
}

async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
        const response = await fetch(CLOUDINARY_URL, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            throw new Error(`Không thể upload ảnh ${file.name}: ${await response.text()}`);
        }
        const data = await response.json();
        return {
            url: data.secure_url,
            publicId: data.public_id
        };
    } catch (error) {
        console.error('Lỗi upload ảnh:', error);
        alert('Lỗi khi upload ảnh lên Cloudinary');
        throw error; // Ném lỗi để bắt ở ngoài
    }
}

async function updateProduct(event) {
    event.preventDefault(); // Ngăn chặn reload trang
    console.log('Bắt đầu cập nhật sản phẩm...');

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập để cập nhật sản phẩm');
        return;
    }

    const productId = document.getElementById('id').value;
    const newImages = Array.from(imageUpload.files);

    console.log('Số ảnh mới:', newImages.length);
    // Upload ảnh mới lên Cloudinary
    const uploadedImages = [];
    try {
        for (const file of newImages) {
            console.log('Đang upload ảnh:', file.name);
            const imageData = await uploadToCloudinary(file);
            if (imageData) {
                uploadedImages.push(imageData);
            }
        }
    } catch (error) {
        console.error('Lỗi trong quá trình upload ảnh:', error);
        return; // Dừng nếu upload ảnh thất bại
    }

    // Kết hợp ảnh cũ và ảnh mới
    const allImages = [...currentImages, ...uploadedImages];
    console.log('Danh sách ảnh cuối cùng:', allImages);

    const productData = {
        name: document.getElementById('name').value,
        price: parseFloat(document.getElementById('price').value),
        salePrice: document.getElementById('salePrice').value ? parseFloat(document.getElementById('salePrice').value) : null,
        description: document.getElementById('description').value,
        stock: parseInt(document.getElementById('stock').value),
        brand: document.getElementById('brand').value,
        origin: document.getElementById('origin').value,
        category: { id: parseInt(document.getElementById('category').value) },
        images: allImages
    };

    try {
        console.log('Gửi request tới server:', productData);
        const response = await fetch(`${API_BASE_URL}/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Không thể cập nhật sản phẩm: ${errorText}`);
        }

        console.log('Cập nhật thành công:', await response.json());
        alert('Cập nhật sản phẩm thành công');
        window.location.href = 'product.html';
    } catch (error) {
        console.error('Lỗi khi cập nhật:', error);
        alert(`Đã có lỗi xảy ra: ${error.message}`);
    }
}

function viewProductReviews() {
    const productId = document.getElementById('id').value;
    if (!productId) {
        alert('Không tìm thấy ID sản phẩm để xem đánh giá!');
        return;
    }
    window.location.href = `../review/review.html?productId=${productId}`;
}

// Gắn sự kiện submit cho form
updateProductForm.addEventListener('submit', updateProduct);

// Lắng nghe sự kiện khi chọn ảnh mới
imageUpload.addEventListener('change', updateImagePreview);

// Tải danh sách danh mục trước, sau đó mới tải thông tin sản phẩm
document.addEventListener('DOMContentLoaded', async () => {
    await fetchCategories();
    await fetchAndPopulateProduct();
});