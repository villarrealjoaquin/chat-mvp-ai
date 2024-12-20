import { MLCEngine } from "@mlc-ai/web-llm";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { ArrowLeft, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";

const selectedModel = "Llama-3.2-3B-Instruct-q4f32_1-MLC";

interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
}

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
  imagesUrls?: string[];
};

const extractImageUrls = (text: string): string[] => {
  const regex = /https?:\/\/[^\s]+/g;
  return text.match(regex) || [];
};

const engine = new MLCEngine({
  initProgressCallback: (info) => {
    console.log(info);
  },
});

export function ProductDetail() {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const { id } = useParams();

  const handleAddNewMessage = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const newMessage: Message = {
      role: "user",
      content: message,
    };

    const currentMessages = [...messages, newMessage];

    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setMessage("");

    if (message.includes("relacionados")) {
      const assistantMessage: Message = {
        role: "assistant",
        content: "",
        imagesUrls: [],
      };

      setMessages((prevMessages) => [...prevMessages, assistantMessage]);

      const reply = await engine.chat.completions.create({
        messages: currentMessages,
      });
      console.log(reply, "reply");
      const AssistantReply = reply.choices[0].message.content ?? "";
      const serializarBotMessage = AssistantReply.split(" ")
        .filter((word) => !word.match(/https?:\/\/[^\s]+/g))
        .join(" ");
      const images = extractImageUrls(AssistantReply);
      const newAssistantMessage: Message = {
        role: "assistant",
        content: serializarBotMessage,
        imagesUrls: images,
      };
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        updatedMessages[updatedMessages.length - 1] = newAssistantMessage;
        return updatedMessages;
      });
      return;
    }

    try {
      const chunks = await engine.chat.completions.create({
        messages: currentMessages,
        temperature: 0.3,
        stream: true,
      });
      console.log(chunks, "reply");

      let reply = "";

      const assistantMessage: Message = {
        role: "assistant",
        content: "",
        imagesUrls: [],
      };

      setMessages((prevMessages) => [...prevMessages, assistantMessage]);

      for await (const chunk of chunks) {
        reply += chunk.choices[0]?.delta.content || "";
        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages];
          updatedMessages[updatedMessages.length - 1] = {
            ...updatedMessages[updatedMessages.length - 1],
            content: reply,
          };
          return updatedMessages;
        });
      }
    } catch (error) {
      console.log(error, "error");
    }
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetch(`https://fakestoreapi.com/products/${id}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((data) => {
          const populateData = {
            ...data,
            relatedProduct: [
              {
                id: 2,
                title: "Zapatillas nike",
                price: 29.99,
                description: "Zapatillas en color blanco",
                category: "Category 2",
                image:
                  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRp3N3Z81fsgI42yzjSARzCW6ucIzaMr55HIQ&s",
              },
              {
                id: 3,
                title: "Zapatos de mujer",
                price: 20.99,
                description: "Zapatos de mujer",
                category: "Category 2",
                image:
                  "https://tse3.mm.bing.net/th?id=OIP.t9O30QXGByQnw3zWXX-_UwHaKN&pid=Api&P=0&h=180",
              },
            ],
          };
          setProduct(populateData);

          setMessages([
            {
              role: "system",
              content: `
              Estás asistiendo al usuario con información sobre un producto específico. A continuación, se te proporcionan las reglas para responder:
    
              **Información del producto principal**:
              - Título: "${data.title}".
              - Precio: $${data.price}.
              - Descripción: "${data.description}".
              - Categoría: "${data.category}".
              - Stock: 22.
    
              **Productos relacionados**:
              - ${populateData.relatedProduct
                .map(
                  (relatedProduct: Product) =>
                    `Título: "${relatedProduct.title}", Precio: $${relatedProduct.price}, Imagen: ${relatedProduct.image}`
                )
                .join("\n- ")}
    
              **Reglas para responder**:
              1. Responde cualquier pregunta sobre este producto de manera clara y útil.
              2. Si la pregunta del usuario no está relacionada con este producto o no tienes información suficiente, responde con:
                 - "No tengo esa información. Por favor, contacta con soporte: soporte@fakestore.com."
              3. Cuando el usuario pregunte con qué puede combinar la prenda, responde únicamente con URLs planas de las imágenes de productos relacionados. 
                 - Ejemplo: si hay 2 productos relacionados, responde con 2 URLs (una por cada producto).
                 - No repitas las URLs ni añadas formato adicional (sin corchetes ni otros caracteres).
    
              **Ejemplo de respuesta para productos relacionados**:
              ${populateData.relatedProduct
                .map((relatedProduct: Product) => relatedProduct.image)
                .join("\n")}
    
              **Estilo de respuesta**:
              - La primera respuesta debe ser breve y directa.
              - No uses el nombre del producto en todas las respuestas a menos que el usuario lo especifique.
              - Utiliza expresiones más genéricas como "este artículo" o "la prenda" para hacer las respuestas más fluidas.
              `,
            },
          ]);
        })
        .catch((error) => {
          setError("Failed to load product. Please try again later." + error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  useEffect(() => {
    const loadModel = async () => {
      await engine.reload(selectedModel);
    };
    loadModel();
  }, []);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => window.history.back()}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {loading ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-8">
                  <Skeleton className="w-full md:w-1/2 aspect-square" />
                  <div className="w-full md:w-1/2 space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : product ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="w-full md:w-1/2 space-y-4">
                    <h1 className="text-3xl font-bold">{product.title}</h1>
                    <p className="text-2xl font-semibold">
                      ${product.price.toFixed(2)}
                    </p>
                    <p className="text-gray-600">{product.description}</p>
                    <p className="text-sm text-gray-500">
                      Categoría: {product.category}
                    </p>
                    <Button className="w-full">Añadir al Carrito</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="lg:col-span-1">
          <Card className="h-[800px]">
            <CardContent className="p-6 flex flex-col h-full">
              <h2 className="text-2xl font-bold mb-4">
                Que te gustaría saber sobre el producto?
              </h2>
              <ScrollArea className="flex-grow mb-4 h-[400px] overflow-auto">
                <div className="space-y-4">
                  {messages.map(({ role, content, imagesUrls }, i) => {
                    if (role === "system") return null;
                    return (
                      <div
                        key={i}
                        className={`bg-muted p-3 rounded-lg ${
                          role === "user" ? "ml-auto max-w-[80%]" : ""
                        }`}
                      >
                        <p className="text-xs font-semibold">
                          {role === "assistant" ? "Soporte" : "Tu"}
                        </p>
                        <p>{content}</p>
                        <article className="flex justify-center items-center">
                          {imagesUrls &&
                            imagesUrls.length > 1 &&
                            imagesUrls?.map((image, i) => (
                              <img
                                src={image}
                                width="200px"
                                key={i}
                                className="object-cover rounded-md"
                                alt={`Image ${i}`}
                              />
                            ))}
                        </article>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
              <form onSubmit={handleAddNewMessage}>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Escribe tu mensaje..."
                    className="flex-grow"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                  />
                  <Button size="icon">
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Enviar mensaje</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
