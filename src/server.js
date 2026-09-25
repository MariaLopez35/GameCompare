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
      `https://api.rawg.io/api/games?key=${process.env.API_KEY}&search=${encodeURIComponent(titleGame)}`,
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

async function compareGamePrices(req, res) {
  const searchTerm = req.query.search;

  if (!searchTerm) {
    return res
      .status(400)
      .json({ error: "El parámetro 'search' es requerido." });
  }

  try {
    const requestHeaders = {
      "User-Agent": "GameCompareApp/1.0 (contacto@gamecompare.com)",
    };

    const [rawgRes, cheapSharkRes] = await Promise.all([
      fetch(
        `https://api.rawg.io/api/games?key=${process.env.API_KEY}&search=${encodeURIComponent(searchTerm)}`,
      ),
      fetch(
        `https://www.cheapshark.com/api/1.0/deals?title=${encodeURIComponent(searchTerm)}&exact=0`,
        {
          headers: requestHeaders,
        },
      ),
    ]);

    const [rawgData, cheapSharkDeals] = await Promise.all([
      rawgRes.json(),
      cheapSharkRes.json(),
    ]);

    const mainGame = rawgData.results?.[0] || null;

    const formattedDeals =
      cheapSharkDeals?.map?.((deal) => ({
        title: deal.title,
        salePrice: `$${deal.salePrice}`,
        normalPrice: `$${deal.normalPrice}`,
        discount: `${Math.round(parseFloat(deal.savings || 0))}%`,
        storeId: deal.storeID,
        dealUrl: `https://www.cheapshark.com/redirect?dealID=${deal.dealID}`,
      })) || [];

    return res.json({
      gameDetails: mainGame
        ? {
            id: mainGame.id,
            title: mainGame.name,
            releaseDate: mainGame.released,
            metacriticScore: mainGame.metacritic,
            coverImage: mainGame.background_image,
          }
        : null,

      dealsSummary: {
        totalDealsFound: formattedDeals.length,
        deals: formattedDeals,
      },
    });
  } catch (error) {
    console.error("Error al comparar precios de juegos:", error);
    return res
      .status(500)
      .json({
        error: "Error interno del servidor al procesar la comparación.",
      });
  }
}

app.get("/api/compare", compareGamePrices);
app.get("/api/games", searchGameByTitle);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
