// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
// Validation utility functions

export const validateEmail = (email: string): string => {
  if (!email.trim()) {
    return 'Vui lòng nhập email';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Email không hợp lệ';
  }
  return '';
};

export const validatePassword = (password: string): string => {
  if (!password) {
    return 'Vui lòng nhập mật khẩu';
  }
  if (password.length < 6) {
    return 'Mật khẩu phải có ít nhất 6 ký tự';
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return 'Mật khẩu phải có chữ hoa, chữ thường và số';
  }
  return '';
};

export const validateUsername = (username: string): string => {
  if (!username.trim()) {
    return 'Vui lòng nhập username';
  }
  if (username.length < 3) {
    return 'Username phải có ít nhất 3 ký tự';
  }
  if (!/^[a-zA-Z0-9._]+$/.test(username)) {
    return 'Username chỉ chứa chữ, số, dấu chấm và gạch dưới';
  }
  return '';
};

export const validateFullName = (fullName: string): string => {
  if (!fullName.trim()) {
    return 'Vui lòng nhập họ tên';
  }
  if (fullName.trim().length < 3) {
    return 'Họ tên phải có ít nhất 3 ký tự';
  }
  return '';
};

export const validateRequired = (value: string, fieldName: string): string => {
  if (!value || !value.toString().trim()) {
    return `Vui lòng nhập ${fieldName}`;
  }
  return '';
};

export const validateAmount = (amount: number | string, fieldName: string = 'số tiền'): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (!amount && amount !== 0) {
    return `Vui lòng nhập ${fieldName}`;
  }
  if (isNaN(numAmount)) {
    return `${fieldName} không hợp lệ`;
  }
  if (numAmount < 0) {
    return `${fieldName} phải lớn hơn 0`;
  }
  return '';
};

export const validateDate = (date: string, fieldName: string = 'ngày'): string => {
  if (!date) {
    return `Vui lòng chọn ${fieldName}`;
  }
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return `${fieldName} không hợp lệ`;
  }
  return '';
};

export const validateDateRange = (startDate: string, endDate: string): { startDate: string; endDate: string } => {
  const errors = { startDate: '', endDate: '' };
  
  if (!startDate) {
    errors.startDate = 'Vui lòng chọn ngày bắt đầu';
  }
  if (!endDate) {
    errors.endDate = 'Vui lòng chọn ngày kết thúc';
  }
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      errors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
  }
  
  return errors;
};

export const validatePhone = (phone: string): string => {
  if (!phone.trim()) {
    return '';  // Phone is optional
  }
  if (!/^(0|\+84)[0-9]{9,10}$/.test(phone.replace(/\s/g, ''))) {
    return 'Số điện thoại không hợp lệ';
  }
  return '';
};

export const validateMinLength = (value: string, minLength: number, fieldName: string): string => {
  if (value && value.length < minLength) {
    return `${fieldName} phải có ít nhất ${minLength} ký tự`;
  }
  return '';
};

export const validateMaxLength = (value: string, maxLength: number, fieldName: string): string => {
  if (value && value.length > maxLength) {
    return `${fieldName} không được vượt quá ${maxLength} ký tự`;
  }
  return '';
};

export const validateConfirmPassword = (password: string, confirmPassword: string): string => {
  if (!confirmPassword) {
    return 'Vui lòng xác nhận mật khẩu';
  }
  if (password !== confirmPassword) {
    return 'Mật khẩu xác nhận không khớp';
  }
  return '';
};
