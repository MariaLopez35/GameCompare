const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;


async function searchGameByTitle(req, res) {
  const titleGame = req.query.search;  

  if (!titleGame) {
    return res
      .status(400)
      .json({ error: "El parámetro 'search' es requerido" });
  }

  try {
    const response = await fetch(
      `https://api.rawg.io/api/games?key=${process.env.API_KEY}&search=${encodeURIComponent(titleGame)}`
    );

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: "Error en la respuesta de RAWG" });
    }

    const game = await response.json();
    res.json(game);
  } catch (error) {
    console.error("Detalle del error:", error);
    res.status(500).json({ error: "Error al obtener los datos" });
  }
}

app.get("/api/games", searchGameByTitle);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});