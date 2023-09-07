export const homepage = async (req, res, next) => {
  try {
    res.send('<h1>Received a credential reuse alert home!</h1>');
  } catch (err) {
    next(err);
  }
  next()
};