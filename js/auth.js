// js/auth.js - النسخة المحدثة مع دعم الإيميل
class AuthManager {
constructor() {
    this.baseUrl = 'https://recyclingm70e.free.nf/api/';
    this.currentUser = null;
    this.init();
}
    
    init() {
        this.loadUser();
        this.checkAuthState();
    }
    
    loadUser() {
        try {
            const userData = localStorage.getItem('user_data');
            if (userData) {
                this.currentUser = JSON.parse(userData);
                console.log('تم تحميل بيانات المستخدم:', this.currentUser.username);
            }
        } catch (error) {
            console.error('خطأ في تحميل بيانات المستخدم:', error);
            this.logout();
        }
    }
    
    // في ملف js/auth.js - تعديل دالة register
async register(userData) {
    try {
        // التحقق من البيانات...
        
        this.showLoading('جاري إنشاء الحساب...');
        
        const response = await fetch(this.baseUrl + 'register.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                full_name: userData.full_name,
                username: userData.username,
                email: userData.email,
                phone: userData.phone,
                password: userData.password
            })
        });
        
        const result = await response.json();
        this.hideLoading();
        
        if (response.ok && result.user) {
            // 🔥 **هنا التعديل المهم** 🔥
            // حفظ بيانات المستخدم المسجل حديثاً مباشرة
            this.currentUser = result.user;
            localStorage.setItem('user_data', JSON.stringify(result.user));
            localStorage.setItem('current_user_id', result.user.id);
            localStorage.setItem('isLoggedIn', 'true');
            
            this.showSuccessMessage('تم إنشاء الحساب بنجاح!');
            
            // 🔥 **إرسال حدث تسجيل الدخول** 🔥
            document.dispatchEvent(new CustomEvent('userLoggedIn', { 
                detail: result.user 
            }));
            
            return { 
                success: true, 
                user: result.user,
                redirect: true // إضافة علامة للتوجيه
            };
        } else {
            this.showErrorMessage(result.message || 'حدث خطأ أثناء إنشاء الحساب');
            return { success: false, message: result.message };
        }
        
    } catch (error) {
        console.error('خطأ في التسجيل:', error);
        this.hideLoading();
        this.showErrorMessage('خطأ في الاتصال بالخادم');
        return { success: false, message: 'خطأ في الاتصال بالخادم' };
    }
}
    async login(usernameOrEmail, password, rememberMe = false) {
        try {
            if (!usernameOrEmail || !password) {
                this.showErrorMessage('يرجى إدخال اسم المستخدم/البريد الإلكتروني وكلمة المرور');
                return { success: false, message: 'يرجى إدخال جميع البيانات' };
            }
            
            this.showLoading('جاري تسجيل الدخول...');
            
            const response = await fetch(this.baseUrl + 'login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username: usernameOrEmail, 
                    password: password 
                })
            });
            
            const result = await response.json();
            this.hideLoading();
            
            if (result.success && result.user) {
                this.currentUser = result.user;
                localStorage.setItem('user_data', JSON.stringify(result.user));
                localStorage.setItem('current_user_id', result.user.id);
                localStorage.setItem('isLoggedIn', 'true');
                
                if (rememberMe) {
                    localStorage.setItem('rememberedUsername', usernameOrEmail);
                } else {
                    localStorage.removeItem('rememberedUsername');
                }
                
                this.showSuccessMessage('مرحباً ' + result.user.full_name + '!');
                
                document.dispatchEvent(new CustomEvent('userLoggedIn', { detail: result.user }));
                
                return { success: true, user: result.user };
            } else {
                this.showErrorMessage(result.message || 'بيانات الدخول غير صحيحة');
                return { success: false, message: result.message };
            }
            
        } catch (error) {
            console.error('خطأ في تسجيل الدخول:', error);
            this.hideLoading();
            this.showErrorMessage('خطأ في الاتصال بالخادم');
            return { success: false, message: 'خطأ في الاتصال بالخادم' };
        }
    }
    
    async updateProfile(userData) {
        try {
            if (!this.currentUser || !this.currentUser.id) {
                this.showErrorMessage('يجب تسجيل الدخول أولاً');
                return { success: false, message: 'يجب تسجيل الدخول أولاً' };
            }
            
            if (userData.email && !this.isValidEmail(userData.email)) {
                this.showErrorMessage('يرجى إدخال بريد إلكتروني صحيح');
                return { success: false, message: 'يرجى إدخال بريد إلكتروني صحيح' };
            }
            
            this.showLoading('جاري تحديث البيانات...');
            
            const response = await fetch(this.baseUrl + 'update_profile.php', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: this.currentUser.id,
                    full_name: userData.full_name,
                    username: userData.username,
                    email: userData.email,
                    phone: userData.phone
                })
            });
            
            const result = await response.json();
            this.hideLoading();
            
            if (result.success) {
                this.currentUser = { ...this.currentUser, ...userData };
                localStorage.setItem('user_data', JSON.stringify(this.currentUser));
                
                this.showSuccessMessage('تم تحديث البيانات بنجاح');
                document.dispatchEvent(new CustomEvent('userDataUpdated', { detail: this.currentUser }));
                
                return { success: true, user: this.currentUser };
            } else {
                this.showErrorMessage(result.message || 'حدث خطأ أثناء تحديث البيانات');
                return { success: false, message: result.message };
            }
            
        } catch (error) {
            console.error('خطأ في تحديث البيانات:', error);
            this.hideLoading();
            this.showErrorMessage('خطأ في الاتصال بالخادم');
            return { success: false, message: 'خطأ في الاتصال بالخادم' };
        }
    }
    
    async changePassword(currentPassword, newPassword) {
        try {
            if (!this.currentUser || !this.currentUser.id) {
                this.showErrorMessage('يجب تسجيل الدخول أولاً');
                return { success: false, message: 'يجب تسجيل الدخول أولاً' };
            }
            
            if (newPassword.length < 6) {
                this.showErrorMessage('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
                return { success: false, message: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' };
            }
            
            this.showLoading('جاري التحقق من كلمة المرور...');
            
            const verifyResponse = await fetch(this.baseUrl + 'login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username: this.currentUser.username, 
                    password: currentPassword 
                })
            });
            
            const verifyResult = await verifyResponse.json();
            
            if (!verifyResponse.ok || !verifyResult.success) {
                this.hideLoading();
                this.showErrorMessage('كلمة المرور الحالية غير صحيحة');
                return { success: false, message: 'كلمة المرور الحالية غير صحيحة' };
            }
            
            this.showLoading('جاري تغيير كلمة المرور...');
            
            const updateResponse = await fetch(this.baseUrl + 'update_profile.php', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: this.currentUser.id,
                    password: newPassword
                })
            });
            
            const result = await updateResponse.json();
            this.hideLoading();
            
            if (result.success) {
                this.showSuccessMessage('تم تغيير كلمة المرور بنجاح');
                return { success: true };
            } else {
                this.showErrorMessage(result.message || 'حدث خطأ أثناء تغيير كلمة المرور');
                return { success: false, message: result.message };
            }
            
        } catch (error) {
            console.error('خطأ في تغيير كلمة المرور:', error);
            this.hideLoading();
            this.showErrorMessage('خطأ في الاتصال بالخادم');
            return { success: false, message: 'خطأ في الاتصال بالخادم' };
        }
    }
    
    async deleteAccount(password) {
        try {
            if (!this.currentUser || !this.currentUser.id) {
                this.showErrorMessage('يجب تسجيل الدخول أولاً');
                return { success: false, message: 'يجب تسجيل الدخول أولاً' };
            }
            
            this.showLoading('جاري التحقق من كلمة المرور...');
            
            const verifyResponse = await fetch(this.baseUrl + 'login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username: this.currentUser.username, 
                    password: password 
                })
            });
            
            const verifyResult = await verifyResponse.json();
            
            if (!verifyResponse.ok || !verifyResult.success) {
                this.hideLoading();
                this.showErrorMessage('كلمة المرور غير صحيحة');
                return { success: false, message: 'كلمة المرور غير صحيحة' };
            }
            
            this.showLoading('جاري حذف الحساب...');
            
            const deleteResponse = await fetch(this.baseUrl + 'delete_account.php', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: this.currentUser.id })
            });
            
            const result = await deleteResponse.json();
            this.hideLoading();
            
            if (result.success) {
                this.logout();
                this.showSuccessMessage('تم حذف الحساب بنجاح');
                return { success: true };
            } else {
                this.showErrorMessage(result.message || 'حدث خطأ أثناء حذف الحساب');
                return { success: false, message: result.message };
            }
            
        } catch (error) {
            console.error('خطأ في حذف الحساب:', error);
            this.hideLoading();
            this.showErrorMessage('خطأ في الاتصال بالخادم');
            return { success: false, message: 'خطأ في الاتصال بالخادم' };
        }
    }
    
    logout() {
        const userName = this.currentUser?.full_name || 'العزيز';
        
        if (confirm(`مرحباً ${userName}، هل تريد تسجيل الخروج؟`)) {
            this.showSuccessMessage(`وداعاً ${userName}، نراك قريباً!`);
            
            const theme = localStorage.getItem('theme');
            const notifications = localStorage.getItem('notifications');
            
            this.currentUser = null;
            localStorage.removeItem('user_data');
            localStorage.removeItem('current_user_id');
            localStorage.removeItem('isLoggedIn');
            
            if (theme) localStorage.setItem('theme', theme);
            if (notifications) localStorage.setItem('notifications', notifications);
            
            document.dispatchEvent(new CustomEvent('userLoggedOut'));
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            
            return true;
        }
        
        return false;
    }
    
    isLoggedIn() {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const userData = localStorage.getItem('user_data');
        return isLoggedIn === 'true' && userData !== null && this.currentUser !== null;
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
    
    checkAuthState() {
        const currentPage = window.location.pathname.split('/').pop();
        const publicPages = ['index.html', 'singup.html', ''];
        const protectedPages = ['dashboard.html', 'profile.html', 'info.html'];
        
        if (this.isLoggedIn() && publicPages.includes(currentPage)) {
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        }
        
        if (!this.isLoggedIn() && protectedPages.includes(currentPage)) {
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    }
    
    async getUserPoints() {
        try {
            if (!this.currentUser || !this.currentUser.id) return 0;
            
            const response = await fetch(`${this.baseUrl}get_points.php?user_id=${this.currentUser.id}`);
            
            if (response.ok) {
                const result = await response.json();
                return result.points || 0;
            }
            
            return 0;
        } catch (error) {
            console.error('خطأ في جلب النقاط:', error);
            return 0;
        }
    }
    
    async updateUserPoints(points) {
        try {
            if (!this.currentUser || !this.currentUser.id) {
                return { success: false, message: 'يجب تسجيل الدخول أولاً' };
            }
            
            const response = await fetch(this.baseUrl + 'update_points.php', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: this.currentUser.id, points: points })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.currentUser.points = points;
                localStorage.setItem('user_data', JSON.stringify(this.currentUser));
                return { success: true };
            } else {
                return { success: false, message: result.message };
            }
            
        } catch (error) {
            console.error('خطأ في تحديث النقاط:', error);
            return { success: false, message: 'خطأ في الاتصال بالخادم' };
        }
    }
    
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }
    
    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }
    
    showMessage(message, type = 'info') {
        const oldMessage = document.querySelector('.auth-message');
        if (oldMessage) oldMessage.remove();
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `auth-message ${type}`;
        messageDiv.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 10000;
            animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            font-family: 'Cairo', sans-serif;
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (messageDiv.parentNode) messageDiv.remove();
                }, 300);
            }
        }, 3000);
    }
    
    showLoading(message = 'جاري التحميل...') {
        this.hideLoading();
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'auth-loading';
        loadingDiv.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <span>${message}</span>
            </div>
        `;
        
        loadingDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;
        
        const spinnerStyle = document.createElement('style');
        spinnerStyle.textContent = `
            .loading-spinner {
                background: white;
                padding: 30px;
                border-radius: 10px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 15px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            }
            
            .loading-spinner i {
                font-size: 40px;
                color: var(--primary-color);
            }
            
            .loading-spinner span {
                font-size: 16px;
                font-weight: 600;
            }
        `;
        
        document.head.appendChild(spinnerStyle);
        document.body.appendChild(loadingDiv);
    }
    
    hideLoading() {
        const loadingDiv = document.querySelector('.auth-loading');
        if (loadingDiv) loadingDiv.remove();
    }
    
    loadRememberedUser() {
        const rememberedUsername = localStorage.getItem('rememberedUsername');
        if (rememberedUsername) {
            const usernameInput = document.getElementById('username');
            if (usernameInput) {
                usernameInput.value = rememberedUsername;
                document.getElementById('remember').checked = true;
            }
        }
    }
}

const authManager = new AuthManager();

document.addEventListener('DOMContentLoaded', function() {
    authManager.loadRememberedUser();
    authManager.checkAuthState();
});

const authStyles = document.createElement('style');
authStyles.textContent = `
    @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
    @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
    .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
`;

document.head.appendChild(authStyles);
