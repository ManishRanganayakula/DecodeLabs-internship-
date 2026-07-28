const User = require('../../src/models/User.model');

const sampleUser = {
  name: 'Test User',
  email: 'unit.test@example.com',
  password: 'Test@1234',
  age: 22,
  phoneNumber: '+919876500099',
};

describe('User Model', () => {
  it('hashes the password before saving', async () => {
    const user = await User.create(sampleUser);
    expect(user.password).not.toBe(sampleUser.password);
  });

  it('excludes the password field by default on find', async () => {
    await User.create(sampleUser);
    const found = await User.findOne({ email: sampleUser.email });
    expect(found.password).toBeUndefined();
  });

  it('correctly compares a valid password', async () => {
    await User.create(sampleUser);
    const found = await User.findOne({ email: sampleUser.email }).select('+password');
    const isMatch = await found.comparePassword(sampleUser.password);
    expect(isMatch).toBe(true);
  });

  it('rejects users younger than 18 at the schema level', async () => {
    await expect(User.create({ ...sampleUser, email: 'young@example.com', age: 10 })).rejects.toThrow();
  });

  it('excludes soft-deleted users from default queries', async () => {
    const user = await User.create({ ...sampleUser, email: 'todelete@example.com' });
    await user.softDelete();
    const found = await User.findOne({ email: 'todelete@example.com' });
    expect(found).toBeNull();
  });

  it('strips sensitive fields via toJSON', async () => {
    const user = await User.create({ ...sampleUser, email: 'json.test@example.com' });
    const json = user.toJSON();
    expect(json.password).toBeUndefined();
    expect(json.refreshToken).toBeUndefined();
  });
});
