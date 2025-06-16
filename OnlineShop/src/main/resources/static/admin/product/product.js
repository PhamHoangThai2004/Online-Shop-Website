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
const pagination = document.createElement('div'); // Thêm phần tử phân trang
pagination.className = 'pagination';
document.querySelector('.main-content').appendChild(pagination);

const CLOUDINARY_CLOUD_NAME = 'dvzqdq4my';
const CLOUDINARY_UPLOAD_PRESET = 'online_shop';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

let currentPage = 0;
const pageSize = 6; // Số sản phẩm trên mỗi trang

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
        alert(`Đã có lỗi xảy ra: ${error.message}`);
    }
}

async function fetchAndRenderProducts(page = currentPage) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Vui lòng đăng nhập để xem danh sách sản phẩm');
            return;
        }

        const sortOption = sortOptionSelect.value;
        let sortParam = 'id,asc'; // Mặc định
        switch (sortOption) {
            case 'idAsc': sortParam = 'id,asc'; break;
            case 'idDesc': sortParam = 'id,desc'; break;
            case 'priceAsc': sortParam = 'price,asc'; break;
            case 'priceDesc': sortParam = 'price,desc'; break;
            case 'nameAsc': sortParam = 'name,asc'; break;
            case 'nameDesc': sortParam = 'name,desc'; break;
        }

        const searchTerm = searchInput.value.trim();
        const url = searchTerm
            ? `${API_BASE_URL}/search-by-keyword?keyword=${encodeURIComponent(searchTerm)}&page=${page}&size=${pageSize}&sort=${sortParam}`
            : `${API_BASE_URL}?page=${page}&size=${pageSize}&sort=${sortParam}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Không thể lấy danh sách sản phẩm: ${await response.text()}`);
        }

        const data = await response.json();
        renderProducts(data.content);
        renderPagination(data.totalPages, data.number);
    } catch (error) {
        alert(`Đã có lỗi xảy ra: ${error.message}`);
    }
}

function renderProducts(products) {
    productTableBody.innerHTML = '';
    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.price ? product.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : 'N/A'}</td>
            <td>${product.stock}</td>
            <td>
                <button onclick="updateProduct(${product.id})">Cập nhật</button>
                <button onclick="deleteProduct(${product.id})">Xóa</button>
            </td>
        `;
        productTableBody.appendChild(row);
    });
}

function renderPagination(totalPages, currentPageNum) {
    pagination.innerHTML = '';
    for (let i = 0; i < totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i + 1;
        button.className = i === currentPageNum ? 'active' : '';
        button.addEventListener('click', () => {
            currentPage = i;
            fetchAndRenderProducts(currentPage);
        });
        pagination.appendChild(button);
    }
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
        throw error;
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

    try {
        if (files.length > 5) {
            alert('Bạn chỉ có thể tải lên tối đa 5 ảnh!');
            return;
        }

        for (let file of files) {
            const { url, publicId } = await uploadImageToCloudinary(file);
            images.push({ url, publicId });
        }

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
        fetchAndRenderProducts(0);
    } catch (error) {
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
            fetchAndRenderProducts(currentPage);
        } catch (error) {
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
        imagePreview.innerHTML = '';
    }
}

imageInput.addEventListener('change', (event) => {
    const files = event.target.files;

    if (files.length > 5) {
        alert('Bạn chỉ có thể tải lên tối đa 5 ảnh!');
        imageInput.value = '';
        imagePreview.innerHTML = '';
        return;
    }

    imagePreview.innerHTML = '';
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

toggleCreateFormButton.addEventListener('click', toggleCreateForm);
cancelCreateButton.addEventListener('click', toggleCreateForm);
document.getElementById('createProductForm').addEventListener('submit', createProduct);

document.addEventListener('DOMContentLoaded', () => {
    fetchCategories();
    fetchAndRenderProducts();
});

searchInput.addEventListener('input', () => {
    currentPage = 0;
    fetchAndRenderProducts(0);
});