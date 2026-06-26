import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import "./SearchDropdown.css";

const MIN_QUERY_LENGTH = 2;
const MAX_SUGGESTIONS = 8;

const SearchDropdown = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [hasSearched, setHasSearched] = useState(false);

  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const listboxId = useId();
  const inputId = useId();

  const trimmedQuery = useMemo(() => searchQuery.trim(), [searchQuery]);
  const showDropdown = isOpen && (suggestions.length > 0 || loading || (hasSearched && trimmedQuery.length >= MIN_QUERY_LENGTH));

  const closeDropdown = () => {
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const fetchSuggestions = async (query) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      setHasSearched(false);

      const response = await fetch(
        `/api/v1/products/search?query=${encodeURIComponent(query)}`,
        {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch suggestions");
      }

      const products = Array.isArray(data.products) ? data.products.slice(0, MAX_SUGGESTIONS) : [];
      setSuggestions(products);
      setIsOpen(true);
      setSelectedIndex(-1);
      setHasSearched(true);
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Search suggestions error:", error);
        setSuggestions([]);
        setIsOpen(true);
        setHasSearched(true);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const query = trimmedQuery;

    if (query.length < MIN_QUERY_LENGTH) {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      setSuggestions([]);
      setIsOpen(false);
      setLoading(false);
      setSelectedIndex(-1);
      setHasSearched(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [trimmedQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closeDropdown();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSelectedIndex(-1);

    if (!value.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      setHasSearched(false);
    }
  };

  const goToProduct = (product) => {
    setSearchQuery("");
    setSuggestions([]);
    closeDropdown();
    navigate(`/product/${product._id}`);
  };

  const goToSearchPage = (queryValue) => {
    const finalQuery = queryValue.trim();
    if (!finalQuery) {
      toast.error("Please enter something to search!");
      return;
    }

    setSuggestions([]);
    closeDropdown();
    navigate(`/search?query=${encodeURIComponent(finalQuery)}`);
    setSearchQuery("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    goToSearchPage(searchQuery);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown && e.key !== "Enter") return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setIsOpen(true);
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : suggestions.length > 0 ? 0 : -1
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length > 0 ? suggestions.length - 1 : -1
        );
        break;

      case "Enter":
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          e.preventDefault();
          goToProduct(suggestions[selectedIndex]);
        }
        break;

      case "Escape":
        e.preventDefault();
        closeDropdown();
        inputRef.current?.blur();
        break;

      default:
        break;
    }
  };

  return (
    <div className="search-dropdown" ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="search-dropdown__form" role="search">
        <label htmlFor={inputId} className="search-dropdown__sr-only">
          Search products
        </label>

        <div className="search-dropdown__input-wrap">
          <input
            id={inputId}
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (trimmedQuery.length >= MIN_QUERY_LENGTH) {
                setIsOpen(true);
              }
            }}
            placeholder="Search products, brands, categories..."
            className="search-dropdown__input"
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showDropdown}
            aria-controls={listboxId}
            aria-activedescendant={
              selectedIndex >= 0 && suggestions[selectedIndex]
                ? `${listboxId}-option-${selectedIndex}`
                : undefined
            }
          />

          {searchQuery && (
            <button
              type="button"
              className="search-dropdown__clear"
              aria-label="Clear search"
              onClick={() => {
                setSearchQuery("");
                setSuggestions([]);
                closeDropdown();
                inputRef.current?.focus();
              }}
            >
              ×
            </button>
          )}

          <button type="submit" className="search-dropdown__button" aria-label="Search">
            {loading ? (
              <span className="search-dropdown__spinner" aria-hidden="true" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>

        {showDropdown && (
          <div className="search-dropdown__panel" role="presentation">
            {loading ? (
              <div className="search-dropdown__state">Searching...</div>
            ) : suggestions.length > 0 ? (
              <div id={listboxId} role="listbox" className="search-dropdown__list">
                {suggestions.map((product, index) => (
                  <button
                    key={product._id}
                    id={`${listboxId}-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={index === selectedIndex}
                    className={`search-dropdown__item ${
                      index === selectedIndex ? "is-active" : ""
                    }`}
                    onClick={() => goToProduct(product)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="search-dropdown__thumb">
                      <img
                        src={product.images?.[0]?.url || "/placeholder.jpg"}
                        alt={product.productname || "Product"}
                        loading="lazy"
                      />
                    </div>

                    <div className="search-dropdown__content">
                      <div className="search-dropdown__name">{product.productname}</div>
                      <div className="search-dropdown__meta">
                        <span>{product.category || "Uncategorized"}</span>
                        {product.specifications?.brand && (
                          <span>• {product.specifications.brand}</span>
                        )}
                      </div>
                    </div>

                    <div className="search-dropdown__price">
                      ₹{Number(product.productprice || 0).toLocaleString("en-IN")}
                    </div>
                  </button>
                ))}

                <button
                  type="button"
                  className="search-dropdown__view-all"
                  onClick={() => goToSearchPage(searchQuery)}
                >
                  <span>View all results for "{searchQuery}"</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M5 12h14M12 5l7 7-7 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="search-dropdown__state">No matching products found.</div>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchDropdown;