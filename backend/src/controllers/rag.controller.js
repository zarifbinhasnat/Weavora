export const askRAG = async (req, res) => {
  const { question, courseId } = req.body;

  res.json({
    answer: `Mock RAG answer for course ${courseId}: "${question}"`,
  });
};
