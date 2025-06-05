document.addEventListener('DOMContentLoaded', function () {
    const API_URL = 'http://localhost:8080/api/categories';
    const token = localStorage.getItem('token');

    const tableBody = document.getElementById('categoryTableBody');
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchName');

    const addForm = document.getElementById('addForm');
    const showAddFormButton = document.getElementById('showAddForm');
    const newCategoryNameInput = document.getElementById('newCategoryName');

    const editForm = document.getElementById('editForm');
    const editCategoryIdInput = document.getElementById('editCategoryId');
    const editCategoryNameInput = document.getElementById('editCategoryName');
    const successDialog = document.getElementById('successDialog');

    function showSuccessMessage(message) {
        successDialog.textContent = message;
        successDialog.style.display = 'block';
        setTimeout(() => {
            successDialog.style.display = 'none';
        }, 3000); // ẩn sau 3 giây
    }

    function fetchCategories(nameFilter = '') {
        fetch(API_URL)
            .then(response => response.json())
            .then(data => {
                tableBody.innerHTML = '';
                const filtered = nameFilter
                    ? data.filter(cat => cat.name.toLowerCase().includes(nameFilter.toLowerCase()))
                    : data;

                if (filtered.length === 0) {
                    const row = document.createElement('tr');
                    row.innerHTML = `<td colspan="3">Không tìm thấy danh mục</td>`;
                    tableBody.appendChild(row);
                } else {
                    filtered.forEach(category => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
              <td>${category.id}</td>
              <td>${category.name}</td>
              <td>
                <button onclick="editCategory(${category.id}, '${category.name}')">Sửa</button>
                <button onclick="deleteCategory(${category.id})">Xóa</button>
              </td>
            `;
                        tableBody.appendChild(row);
                    });
                }
            })
            .catch(err => console.error('Lỗi khi lấy danh mục:', err));
    }

    // Tìm kiếm
    searchForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const keyword = searchInput.value.trim();
        fetchCategories(keyword);
    });

    // Hiện form thêm
    showAddFormButton.addEventListener('click', function () {
        addForm.style.display = addForm.style.display === 'none' ? 'block' : 'none';
        editForm.style.display = 'none'; // ẩn form sửa nếu đang hiện
    });

    // Thêm danh mục
    addForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const name = newCategoryNameInput.value.trim();
        if (!name) return alert('Vui lòng nhập tên danh mục.');

        fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name })
        })
            .then(response => {
                if (response.ok) {
                    newCategoryNameInput.value = '';
                    addForm.style.display = 'none';
                    fetchCategories();
                } else {
                    return response.text().then(text => { throw new Error(text); });
                }
            })
            .catch(err => {
                console.error('Lỗi khi thêm danh mục:', err);
                alert('Lỗi khi thêm danh mục');
            });
    });

    // Hiển thị form sửa danh mục
    window.editCategory = function (id, name) {
        addForm.style.display = 'none';
        editForm.style.display = 'block';
        editCategoryIdInput.value = id;
        editCategoryNameInput.value = name;
    };

    // Xử lý cập nhật danh mục
    editForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const id = editCategoryIdInput.value;
        const name = editCategoryNameInput.value.trim();
        if (!name) return alert('Vui lòng nhập tên danh mục.');

        fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name })
        })
            .then(response => {
                if (response.ok) {
                    editForm.style.display = 'none';
                    fetchCategories(searchInput.value.trim());
                    showSuccessMessage('Sửa danh mục thành công!');
                } else {
                    return response.text().then(text => { throw new Error(text); });
                }
            })
            .catch(err => {
                console.error('Lỗi khi sửa danh mục:', err);
                alert('Lỗi khi sửa danh mục');
            });
    });

    // Xóa danh mục
    window.deleteCategory = function (id) {
        if (!confirm('Bạn có chắc muốn xóa danh mục này?')) return;

        fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => {
                if (response.ok) {
                    fetchCategories(searchInput.value.trim());
                } else {
                    alert('Lỗi khi xóa danh mục');
                }
            })
            .catch(err => {
                console.error('Lỗi khi xóa:', err);
            });
    };

    // Khởi tạo
    fetchCategories();
});
