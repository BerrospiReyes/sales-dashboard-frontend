import { Component, OnInit } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { CommonModule } from '@angular/common'; // Reemplaza NgIf, NgFor y JsonPipe por este
import { FormsModule } from '@angular/forms'; // Necesario para los filtros

const GET_SALES = gql`
  query GetSales {
    sales {
      id
      category
      brand
      amount
    }
  }
`;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule], // Simplificado y completo
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  sales: any[] = [];
  categoryTotals: { category: string; total: number }[] = [];
  
  // Agregamos variables para filtros
  selectedCategory: string = '';
  availableBrands: string[] = [];
  selectedBrand: string = '';
  
  brandsMap: any = {
    'Gaseosas': ['Coca Cola', 'Pepsi'],
    'Aguas': ['San Luis', 'San Mateo']
  };

  constructor(private apollo: Apollo) {}

  ngOnInit(): void {
    this.apollo
      .watchQuery<{ sales: any[] }>({
        query: GET_SALES,
      })
      .valueChanges.subscribe(({ data }) => {
        this.sales = (data?.sales ?? []).map(
          ({ __typename, ...sale }) => sale
        );
        this.calculateTotals();
      });
  }

  onCategoryChange() {
    this.availableBrands = this.brandsMap[this.selectedCategory] || [];
    this.selectedBrand = '';
  }

  private calculateTotals(): void {
    const map = new Map<string, number>();
    for (const sale of this.sales) {
      map.set(sale.category, (map.get(sale.category) || 0) + sale.amount);
    }
    this.categoryTotals = Array.from(map, ([category, total]) => ({
      category,
      total,
    }));
  }
}