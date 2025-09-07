import express from "express";
import fetch from "node-fetch"; // ESM-only

const app = express();
const PORT = 5000;

// Serve frontend folder
app.use(express.static("public"));

// Required fields according to Legal Metrology rules
const REQUIRED_FIELDS = [
  "product_name",
  "brand",
  "manufacturer",
  "net_quantity",
  "mrp",
  "date_of_manufacture",
  "expiration_date",
  "country_of_origin",
  "consumer_care"
];

// Fetch products from Open Food Facts API
async function fetchProducts(category, limit = 10) {
  const url = `https://world.openfoodfacts.org/category/${category}.json`;
  try {
    const res = await fetch(url);       // Fetch JSON data from API
    const data = await res.json();
    const products = data.products;

    // Process products and compute compliance
    return products.slice(0, limit).map(p => {
      const product = {
        product_name: p.product_name || "N/A",
        brand: p.brands || "N/A",
        manufacturer: p.manufacturing_places || "N/A",
        net_quantity: p.quantity || "N/A",
        mrp: p.stores_tags?.[0] || "N/A",
        date_of_manufacture: p.created_t || "N/A",
        expiration_date: p.expiration_date || "N/A",
        country_of_origin: p.countries || "N/A",
        consumer_care: p.emb_codes || "N/A",
        description: p.ingredients_text || "N/A",
        compliance: {}
      };

      // Mark which fields are present (true/false)
      REQUIRED_FIELDS.forEach(f => {
        product.compliance[f] = product[f] !== "N/A";
      });

      // Overall legally compliant check: all required fields must be present
      product.legally_compliant = REQUIRED_FIELDS.every(f => product.compliance[f]);

      return product;
    });
  } catch (err) {
    console.error("Error fetching products:", err.message);
    return [];
  }
}

// API endpoint to fetch products by category
app.get("/api/products", async (req, res) => {
  const category = req.query.category || "soaps"; // Default category = soaps
  const limit = parseInt(req.query.limit) || 10; // Default limit = 10 products
  const products = await fetchProducts(category, limit);
  res.json(products); // Send JSON response to frontend
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
