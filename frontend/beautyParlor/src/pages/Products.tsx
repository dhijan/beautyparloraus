import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CAT_IMAGES,
  CAT_LABELS,
  fmtPrice,
  splitVariant,
} from "../data/shopProducts";
import { getShopProducts } from "../api/shopApi";
import { shopPerks } from "../data/bbhData";
import type { ShopCategory, ShopProduct } from "../types/shop";

const PAGE_SIZE = 12;
const ENQUIRY_EMAIL = "eyebrowbeautyhub@gmail.com";

// A product is buyable only if it has a price and a Stripe Payment Link.
// Anything else becomes an email enquiry.
function isBuyable(product: ShopProduct) {
  return (
    Boolean(product.paymentLink) && product.price !== null && product.price > 0
  );
}

interface ProductGroup {
  base: string;
  cat: ShopCategory;
  variants: ShopProduct[];
  sizes: (string | null)[];
  minPrice: number;
  buyable: boolean;
}

function groupBySize(products: ShopProduct[]): ProductGroup[] {
  const groups = new Map<string, ProductGroup>();

  for (const product of products) {
    const { base, size } = splitVariant(product.name);
    const group = groups.get(base);

    if (group) {
      group.variants.push(product);
      group.sizes.push(size);
    } else {
      groups.set(base, {
        base,
        cat: product.cat,
        variants: [product],
        sizes: [size],
        minPrice: 0,
        buyable: false,
      });
    }
  }

  for (const group of groups.values()) {
    group.minPrice = Math.min(
      ...group.variants.map((v) => Number(v.price ?? Infinity))
    );
    group.buyable = group.variants.some(isBuyable);
  }

  return [...groups.values()];
}

function Products() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [activeFilter, setActiveFilter] = useState("all");
  const [activeSort, setActiveSort] = useState("default");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  // group base name -> chosen variant id
  const [chosen, setChosen] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadProducts() {
      try {
        setProducts(await getShopProducts());
      } catch {
        setLoadError("Could not load products. Please try again shortly.");
      } finally {
        setLoadingProducts(false);
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [activeFilter, activeSort, searchQuery]);

  // Only offer filters for categories that actually have products.
  const filters = useMemo<("all" | ShopCategory)[]>(
    () => ["all", ...new Set(products.map((product) => product.cat))],
    [products]
  );

  const groups = useMemo(() => {
    let list = products;

    if (activeFilter !== "all") {
      list = list.filter((product) => product.cat === activeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter((product) =>
        product.name.toLowerCase().includes(query)
      );
    }

    const grouped = groupBySize(list);

    // Sorting uses the group's lowest price, not the selected variant's, so
    // picking a different size never reshuffles the grid under the cursor.
    if (activeSort === "az") {
      grouped.sort((a, b) => a.base.localeCompare(b.base));
    }

    if (activeSort === "za") {
      grouped.sort((a, b) => b.base.localeCompare(a.base));
    }

    if (activeSort === "lohi") {
      grouped.sort((a, b) => a.minPrice - b.minPrice);
    }

    if (activeSort === "hilo") {
      grouped.sort((a, b) => b.minPrice - a.minPrice);
    }

    // Enquiry-only products always sink to the bottom, whatever the sort.
    return grouped.sort((a, b) => Number(b.buyable) - Number(a.buyable));
  }, [products, activeFilter, activeSort, searchQuery]);

  const pageCount = Math.max(1, Math.ceil(groups.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleGroups = groups.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Default to the cheapest buyable size so a card never opens on a variant
  // that has no payment link while a purchasable one exists.
  const selectedVariant = (group: ProductGroup) => {
    const picked = group.variants.find((v) => v.id === chosen[group.base]);
    if (picked) return picked;

    const buyable = group.variants
      .filter(isBuyable)
      .sort((a, b) => Number(a.price) - Number(b.price));

    return buyable[0] || group.variants[0];
  };

  // Buyable products link straight to their Stripe Payment Link; everything
  // else opens a pre-addressed email, since there is no contact page.
  const buyHref = (product: ShopProduct) =>
    isBuyable(product)
      ? (product.paymentLink as string)
      : `mailto:${ENQUIRY_EMAIL}?subject=${encodeURIComponent(
          `Product enquiry — ${product.name}`
        )}`;

  return (
    <main className="bbh-page">
      <div className="bbh-page-head">
        <div>
          <Link to="/" className="bbh-back">
            ← Back home
          </Link>

          <h1 className="bbh-display bbh-h1 bbh-fade-up">
            The <em>shop</em>
          </h1>

          <p
            className="bbh-lede bbh-fade-up"
            style={{ maxWidth: 440, marginTop: 18, animationDelay: "0.12s" }}
          >
            The same products our therapists reach for in the studio — nothing
            on this shelf we would not use on you. Free pick-up from any of our
            four locations.
          </p>
        </div>

        <div className="bbh-filters">
          {filters.map((cat) => (
            <button
              key={cat}
              className={activeFilter === cat ? "active" : ""}
              onClick={() => setActiveFilter(cat)}
            >
              {cat === "all" ? "All" : CAT_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "center",
          marginTop: 40,
        }}
      >
        <label className="bbh-search" style={{ flex: "1 1 280px" }}>
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <input
            type="search"
            placeholder="Search products…"
            aria-label="Search products"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>

        <label className="bbh-search" style={{ flex: "0 0 auto" }}>
          <span className="bbh-meta">Sort</span>
          <select
            value={activeSort}
            onChange={(event) => setActiveSort(event.target.value)}
            style={{
              border: 0,
              background: "transparent",
              font: "inherit",
              color: "inherit",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="default">Default</option>
            <option value="az">Name A–Z</option>
            <option value="za">Name Z–A</option>
            <option value="lohi">Price: Low–High</option>
            <option value="hilo">Price: High–Low</option>
          </select>
        </label>
      </div>

      {loadError ? (
        <p className="bbh-state">{loadError}</p>
      ) : (
        <p className="bbh-note" style={{ marginTop: 22 }}>
          {loadingProducts
            ? "Loading products…"
            : `Showing ${visibleGroups.length} of ${groups.length} product${
                groups.length !== 1 ? "s" : ""
              }`}
        </p>
      )}

      <div className="bbh-grid-3" style={{ marginTop: 24 }}>
        {visibleGroups.map((group, index) => {
          const variant = selectedVariant(group);
          const buyable = isBuyable(variant);

          return (
            <article
              key={group.base}
              className="bbh-prod bbh-shop-card bbh-glass bbh-lift"
              data-reveal={index % 3}
            >
              <div className="bbh-thumb">
                <img
                  src={variant.imageUrl || CAT_IMAGES[variant.cat]}
                  alt={group.base}
                  loading="lazy"
                />

                {variant.tag && <span className="tag ink">{variant.tag}</span>}
              </div>

              <span className="cat">{CAT_LABELS[group.cat]}</span>

              <h3>{group.base}</h3>

              <p>{variant.desc}</p>

              {group.variants.length > 1 && (
                <div
                  className="bbh-sizes"
                  role="radiogroup"
                  aria-label={`Size for ${group.base}`}
                >
                  {group.variants.map((option, optionIndex) => (
                    <button
                      key={option.id}
                      role="radio"
                      aria-checked={option.id === variant.id}
                      className={option.id === variant.id ? "active" : ""}
                      onClick={() =>
                        setChosen({ ...chosen, [group.base]: option.id })
                      }
                    >
                      {group.sizes[optionIndex] || "Standard"}
                    </button>
                  ))}
                </div>
              )}

              <div className="bbh-shop-foot">
                <div className="meta">
                  <span className="bbh-price">{fmtPrice(variant.price)}</span>
                  {group.sizes.length === 1 && group.sizes[0] && (
                    <span className="sub">{group.sizes[0]}</span>
                  )}
                </div>

                <a className="bbh-btn sm" href={buyHref(variant)}>
                  {buyable ? "Buy now" : "Enquire"}
                </a>
              </div>
            </article>
          );
        })}
      </div>

      {pageCount > 1 && (
        <nav className="bbh-pager" aria-label="Product pages">
          <button
            className="bbh-btn sm outline"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ← Prev
          </button>

          <span className="bbh-note">
            Page {currentPage} of {pageCount}
          </span>

          <button
            className="bbh-btn sm outline"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage === pageCount}
          >
            Next →
          </button>
        </nav>
      )}

      <p className="bbh-note" style={{ marginTop: 26, textAlign: "center" }}>
        Payments are processed securely by Stripe — you will be redirected to
        complete your purchase.
      </p>

      <div
        className="bbh-dark bbh-cta-split"
        data-reveal="0"
        style={{ marginTop: 64 }}
      >
        <div className="bbh-dark-glow" data-parallax="-0.04"></div>

        <div>
          <div className="bbh-eyebrow light">Not sure what suits you</div>

          <h2
            className="bbh-display"
            style={{ marginTop: 18, fontSize: "clamp(30px,3.6vw,50px)" }}
          >
            Book a free product{" "}
            <em style={{ color: "var(--bbh-brass)" }}>consultation</em>
          </h2>

          <p
            style={{
              margin: "16px 0 0",
              maxWidth: 460,
              fontSize: 15,
              lineHeight: 1.62,
              color: "rgba(242,239,233,.62)",
            }}
          >
            Ten minutes with a therapist, in studio or over the phone — we will
            build a routine around your treatment plan, not a shelf.
          </p>
        </div>

        <Link className="bbh-btn cream" to="/book">
          Book a consult
        </Link>
      </div>

      <div className="bbh-perks">
        {shopPerks.map((perk, index) => (
          <div
            key={perk.title}
            className="bbh-perk bbh-glass"
            data-reveal={index}
          >
            <span className="mark">{perk.mark}</span>
            <div>
              <h4>{perk.title}</h4>
              <p>{perk.copy}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

export default Products;
