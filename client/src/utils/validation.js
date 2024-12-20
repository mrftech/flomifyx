export const validator = {
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  password: (password) => {
    return password && password.length >= 8;
  },

  itemType: (type) => {
    const validTypes = [
      'Components',
      'Blocks',
      'Templates',
      'Elements',
      'Animations'
    ];
    return validTypes.includes(type);
  },

  licenseType: (type) => {
    return ['Free', 'Premium'].includes(type);
  }
}; 