import { useEffect, useState } from 'react';

const API_URL = 'https://fakestoreapi.com/products';

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      try {
        const response = await fetch(API_URL);

        if (response.status === 403) {
          if (!cancelled) {
            setError('Доступ запрещён (403). У вас нет прав для просмотра данных.');
          }
          return;
        }

        if (!response.ok) {
          if (!cancelled) {
            setError(`Ошибка при загрузке данных: ${response.status}`);
          }
          return;
        }

        const data = await response.json();
        if (!cancelled) setProducts(data);
      } catch (err) {
        if (!cancelled) {
          setError('Не удалось загрузить данные. Проверьте соединение.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <p data-testid="loading">Загрузка...</p>;

  if (error) {
    return (
      <div className="error" role="alert" data-testid="error-message">
       {error}
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Товары</h1>
      <ul className="products" data-testid="products-list">
        {products.map((p) => (
          <li key={p.id} className="product" data-testid="product-item">
            <img src={p.image} alt={p.title} width="80" />
            <div>
              <h3>{p.title}</h3>
              <p className="price">${p.price}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}