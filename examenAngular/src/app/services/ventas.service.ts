
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import type {
  DatosCliente,
  PizzaPedido
} from '../components/formulario-pedido/formulario-pedido';


export interface Venta {
  idventa: number;
  nombre_cliente: string;
  direccion: string;
  telefono: string;
  fecha_pedido: string;
  total: number;
}

export interface DetalleVenta {
  iddetalle: number;
  idventa: number;
  tamano: string;
  ingredientes: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface ReporteVenta {
  nombre: string;
  cantidad_pedidos: number;
  total_ventas: number;
}

export interface RespuestaVenta {
  exito: boolean;
  mensaje: string;
  idventa: number;
  total: number;
  detalle: PizzaPedido[];
}

export interface RespuestaVentas {
  exito: boolean;
  ventas: Venta[];
}

export interface RespuestaDetalleVenta {
  exito: boolean;
  venta: Venta;
  detalles: DetalleVenta[];
}

export interface RespuestaReportes {
  exito: boolean;
  tipo: 'dia' | 'mes';
  reportes: ReporteVenta[];
}

export interface RespuestaConsultaPeriodo {
  exito: boolean;
  tipo: 'dia' | 'mes';
  nombre: string;
  cantidad_pedidos: number;
  total_acumulado: number;
  ventas: Venta[];
}


@Injectable({
  providedIn: 'root'
})
export class VentasService {

  private http = inject(HttpClient);

  private apiUrl =
    'http://127.0.0.1:5001/api/pizzeria/ventas';


  // GUARDAR UN PEDIDO
  registrarVenta(
    cliente: DatosCliente,
    pizzas: PizzaPedido[]
  ): Observable<RespuestaVenta> {

    const pedido = {
      ...cliente,
      pizzas: pizzas.map(pizza => ({
        tamano: pizza.tamano,
        ingredientes: pizza.ingredientes,
        cantidad: pizza.cantidad
      }))
    };

    return this.http.post<RespuestaVenta>(
      this.apiUrl,
      pedido
    );
  }


  // TODAS LAS VENTAS
  obtenerVentas(): Observable<RespuestaVentas> {

    return this.http.get<RespuestaVentas>(
      this.apiUrl
    );
  }


  // DETALLE DE UNA VENTA
  obtenerDetalleVenta(
    idventa: number
  ): Observable<RespuestaDetalleVenta> {

    return this.http.get<RespuestaDetalleVenta>(
      `${this.apiUrl}/${idventa}`
    );
  }


  // REPORTE GENERAL AGRUPADO
  obtenerReportes(
    tipo: 'dia' | 'mes'
  ): Observable<RespuestaReportes> {

    return this.http.get<RespuestaReportes>(
      `${this.apiUrl}/reportes?tipo=${tipo}`
    );
  }


  // BUSQUEDA POR NOMBRE DE DIA O MES
  consultarPeriodo(
    tipo: 'dia' | 'mes',
    nombre: string
  ): Observable<RespuestaConsultaPeriodo> {

    const nombreSeguro = encodeURIComponent(nombre);

    return this.http.get<RespuestaConsultaPeriodo>(
      `${this.apiUrl}/reportes/consulta?tipo=${tipo}&nombre=${nombreSeguro}`
    );
  }

}
