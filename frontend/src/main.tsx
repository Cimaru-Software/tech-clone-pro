import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout, NotFoundPage } from "@/routes/__root";
import Home from "@/routes/index";
import Tienda from "@/routes/tienda";
import Servicios from "@/routes/servicios";
import Promociones from "@/routes/promociones";
import Proyectos from "@/routes/proyectos";
import Nosotros from "@/routes/nosotros";
import Contacto from "@/routes/contacto";
import LoginPage from "@/routes/login";
import RegistroPage from "@/routes/registro";
import Checkout from "@/routes/checkout";
import PerfilPage from "@/routes/perfil";
import MisPedidosPage from "@/routes/mis-pedidos";
import ProductoDetalle from "@/routes/producto/$id";
import ProductRedirect from "@/routes/product/$id";
import Noticias from "@/routes/noticias/index";
import NoticiaDetalle from "@/routes/noticias/$slug";
import "@/styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="tienda" element={<Tienda />} />
          <Route path="servicios" element={<Servicios />} />
          <Route path="promociones" element={<Promociones />} />
          <Route path="proyectos" element={<Proyectos />} />
          <Route path="nosotros" element={<Nosotros />} />
          <Route path="contacto" element={<Contacto />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="registro" element={<RegistroPage />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="perfil" element={<PerfilPage />} />
          <Route path="mis-pedidos" element={<MisPedidosPage />} />
          <Route path="producto/:id" element={<ProductoDetalle />} />
          <Route path="product/:id" element={<ProductRedirect />} />
          <Route path="noticias" element={<Noticias />} />
          <Route path="noticias/:slug" element={<NoticiaDetalle />} />
          <Route path="mi-cuenta" element={<Navigate to="/perfil" replace />} />
          <Route path="mi-cuenta/pedidos" element={<Navigate to="/mis-pedidos" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
