const API_BASE_URL = 'http://localhost:8080/api/products';
const productTableBody = document.getElementById('productTableBody');
const createProductSection = document.getElementById('createProductSection');
const productListSection = document.getElementById('productListSection');
const toggleCreateFormButton = document.getElementById('toggleCreateFormButton');
const cancelCreateButton = document.getElementById('cancelCreateButton');
const categorySelect = document.getElementById('category');
const imageInput = document.getElementById('images');
const imagePreview = document.getElementById('imagePreview');
const searchInput = document.getElementById('searchInput');
const sortOptionSelect = document.getElementById('sortOption');

// Thông tin Cloudinary
const CLOUDINARY_CLOUD_NAME = 'dvzqdq4my';
const CLOUDINARY_UPLOAD_PRESET = 'online_shop';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

async function fetchCategories() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Vui lòng đăng nhập để lấy danh sách danh mục');
            return;
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
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Lỗi:', error);
        alert(`Đã có lỗi xảy ra: ${error.message}`);
    }
}

async function fetchAndRenderProducts() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Vui lòng đăng nhập để xem danh sách sản phẩm');
            return;
        }

        const response = await fetch(API_BASE_URL, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Không thể lấy danh sách sản phẩm: ${await response.text()}`);
        }

        const products = await response.json();
        renderProducts(products);
    } catch (error) {
        console.error('Lỗi:', error);
        alert(`Đã có lỗi xảy ra: ${error.message}`);
    }
}

function renderProducts(products) {
    const searchTerm = searchInput.value.toLowerCase();

    // Lọc sản phẩm theo tên
    let filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm)
    );

    // Sắp xếp sản phẩm dựa trên lựa chọn
    const sortOption = sortOptionSelect.value;

    if (sortOption === 'idAsc') {
        filteredProducts.sort((a, b) => a.id - b.id);
    } else if (sortOption === 'idDesc') {
        filteredProducts.sort((a, b) => b.id - a.id);
    } else if (sortOption === 'priceAsc') {
        filteredProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortOption === 'priceDesc') {
        filteredProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortOption === 'nameAsc') {
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === 'nameDesc') {
        filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
    }

    // Render danh sách sản phẩm
    productTableBody.innerHTML = '';
    filteredProducts.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.price}</td>
            <td>${product.stock}</td>
            <td>
                <button onclick="updateProduct(${product.id})">Cập nhật</button>
                <button onclick="deleteProduct(${product.id})">Xóa</button>
            </td>
        `;
        productTableBody.appendChild(row);
    });
}

async function uploadImageToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
        const response = await fetch(CLOUDINARY_UPLOAD_URL, {
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
        console.error(`Lỗi upload ảnh ${file.name}:`, error);
        throw error; // Ném lỗi để bắt ở ngoài
    }
}

async function createProduct(event) {
    event.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập để tạo sản phẩm');
        return;
    }

    const files = imageInput.files;
    const images = [];

    console.log('Tổng số file:', files.length); // Kiểm tra số lượng file

    // Upload từng ảnh lên Cloudinary
    try {
        for (let file of files) {
            console.log('Đang upload file:', file.name); // Log tên file
            const { url, publicId } = await uploadImageToCloudinary(file);
            images.push({ url, publicId });
            console.log('Đã upload:', { url, publicId }); // Log kết quả
        }

        console.log('Danh sách ảnh đã upload:', images);

        const productData = {
            name: document.getElementById('name').value,
            price: parseFloat(document.getElementById('price').value),
            salePrice: document.getElementById('salePrice').value ? parseFloat(document.getElementById('salePrice').value) : null,
            description: document.getElementById('description').value,
            stock: parseInt(document.getElementById('stock').value),
            brand: document.getElementById('brand').value,
            origin: document.getElementById('origin').value,
            categoryId: parseInt(document.getElementById('category').value),
            images: images
        };

        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });

        if (!response.ok) {
            throw new Error(`Không thể tạo sản phẩm: ${await response.text()}`);
        }

        alert('Thêm sản phẩm thành công');
        document.getElementById('createProductForm').reset();
        toggleCreateForm();
        fetchAndRenderProducts();
    } catch (error) {
        console.error('Lỗi:', error);
        alert(`Đã có lỗi xảy ra: ${error.message}`);
    }
}

async function updateProduct(id) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập để cập nhật sản phẩm');
        return;
    }

    window.location.href = `detail.html?id=${id}`;
}

async function deleteProduct(id) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập để xóa sản phẩm');
        return;
    }

    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Không thể xóa sản phẩm: ${await response.text()}`);
            }

            alert('Xóa sản phẩm thành công');
            fetchAndRenderProducts();
        } catch (error) {
            console.error('Lỗi:', error);
            alert(`Đã có lỗi xảy ra: ${error.message}`);
        }
    }
}

function toggleCreateForm() {
    if (createProductSection.style.display === 'none') {
        createProductSection.style.display = 'block';
        productListSection.style.display = 'none';
        toggleCreateFormButton.textContent = 'Hủy Thêm Sản Phẩm';
    } else {
        createProductSection.style.display = 'none';
        productListSection.style.display = 'block';
        toggleCreateFormButton.textContent = 'Thêm Sản Phẩm';
        document.getElementById('createProductForm').reset();
        imagePreview.innerHTML = ''; // Xóa preview ảnh khi hủy
    }
}

// Hiển thị preview tất cả các ảnh đã chọn
imageInput.addEventListener('change', (event) => {
    console.log('Số lượng file đã chọn:', imageInput.files.length);
    const files = event.target.files;

    if (files.length > 5) {
        alert('Bạn chỉ có thể tải lên tối đa 5 ảnh!');
        imageInput.value = ''; // Reset input
        imagePreview.innerHTML = ''; // Xóa preview
        return;
    }

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = file.name;
            img.classList.add('preview-image');
            imagePreview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
});

// Gắn sự kiện cho nút "Thêm Sản Phẩm"
toggleCreateFormButton.addEventListener('click', toggleCreateForm);

// Gắn sự kiện cho nút "Hủy"
cancelCreateButton.addEventListener('click', toggleCreateForm);

// Gắn sự kiện cho form tạo sản phẩm
document.getElementById('createProductForm').addEventListener('submit', createProduct);

// Tải danh sách danh mục và sản phẩm khi trang được tải
document.addEventListener('DOMContentLoaded', () => {
    fetchCategories();
    fetchAndRenderProducts();
});

// Gắn sự kiện tìm kiếm theo input
searchInput.addEventListener('input', fetchAndRenderProducts);