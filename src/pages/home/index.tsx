import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardFooter } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";

interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  relatedProducts: Product[];
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("https://fakestoreapi.com/products")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        console.log(data, "response");
        const normalizadData = data.map((product: Product) => ({
          ...product,
          relatedProducts: [
            {
              id: 1,
              title: "Product 1",
              price: 19.99,
              description: "Description for Product 1",
              category: "Category 1",
              image:
                "https://www.moov.com.ar/on/demandware.static/-/Sites-365-dabra-catalog/default/dw725e21af/products/ADIF9995/ADIF9995-6.JPG",
            },
            {
              id: 2,
              title: "Product 2",
              price: 29.99,
              description: "Description for Product 2",
              category: "Category 2",
              image:
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRp3N3Z81fsgI42yzjSARzCW6ucIzaMr55HIQ&s",
            },
          ],
        }));
        setProducts(normalizadData);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching products:", error);
        setError("Failed to load products. Please try again later.");
        setLoading(false);
      });
  }, []);

  return (
    <div className="container mx-auto px-4">
      <section className="py-12 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Bienvenido a nuestra Tienda
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                Descubre nuestra selección de productos de alta calidad a
                precios increíbles.
              </p>
            </div>
            <div className="space-x-4">
              <Button>Comprar Ahora</Button>
              <Button variant="outline">Saber Más</Button>
            </div>
          </div>
        </div>
      </section>

      {/* <div className="">
        <ul className="flex items-center flex-wrap font-bold gap-3 bg-black text-white w-[150px] h-[400px] [&>*:nth-child(2)]:self-start">
          {new Array(15).fill(null).map((_, index) => (
            <li key={index}>{index + 1}</li>
          ))}
        </ul>
      </div> */}

      <section className="py-12">
        <h2 className="text-2xl font-bold mb-8">Nuestros Productos</h2>
        {error && <p className="text-red-500 text-center">{error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loading
            ? Array(8)
                .fill(0)
                .map((_, index) => (
                  <Card key={index} className="flex flex-col justify-between">
                    <CardContent className="p-4">
                      <Skeleton className="h-48 w-full mb-4" />
                      <Skeleton className="h-4 w-2/3 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                    <CardFooter className="p-4">
                      <Skeleton className="h-10 w-full" />
                    </CardFooter>
                  </Card>
                ))
            : products.map((product) => (
                <Card
                  key={product.id}
                  className="flex flex-col justify-between"
                >
                  <CardContent className="p-4">
                    <div className="aspect-square relative mb-4">
                      <img
                        src={product.image}
                        alt=""
                        className="object-contain"
                      />
                    </div>
                    <h3 className="font-semibold mb-2 line-clamp-1">
                      {product.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                      {product.description}
                    </p>
                    <p className="font-bold">${product.price.toFixed(2)}</p>
                  </CardContent>
                  <CardFooter className="p-4">
                    <Link to={`/detail/${product.id}`}>
                      <Button className="w-full">Ver producto</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
        </div>
      </section>
    </div>
  );
}
