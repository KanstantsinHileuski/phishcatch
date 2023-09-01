
export const alert = async (req, res, next) => {
  try {
    console.info("Received a credential reuse alert!")
    res.send('<script>alert(`Received a credential reuse alert!`)</script>');
  } catch (err) {
    next(err);
  }
};