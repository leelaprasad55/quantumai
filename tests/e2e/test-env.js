function getE2EAuth() {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (!email || !password) {
    return null;
  }
  return { email, password };
}

export {
  getE2EAuth,
};
