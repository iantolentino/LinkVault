# LinkVault

LinkVault is a web application designed to help users organize and manage their favorite links across various categories. Users can add, edit, search, and delete links, making it easy to access resources and information quickly.

## Features

- **Responsive Design**: Adapts to various screen sizes for optimal viewing on desktops, tablets, and mobile devices.
- **Category Management**: Create, edit, and delete categories for organizing links.
- **Link Management**: Add, edit, and delete links within each category.
- **Search Functionality**: Search for links within categories by typing in the search bar.
- **Dark/Light Mode Toggle**: Switch between dark and light themes for a comfortable viewing experience.
- **Local Storage**: Saves categories and links using local storage to persist data between sessions.

## Technologies Used

- HTML5
- CSS3
- JavaScript

## Getting Started

To run LinkVault locally, follow these steps:

1. **Clone the repository** (or download the code):
   ```bash
   git clone <repository-url>
   cd LinkVault
   ```

2. **Open `index.html`** in your web browser:
   Simply double-click the `index.html` file, or drag it into your browser to view the application.

## Usage

- **Adding a Category**: Click the "Add Category" button in the header and enter the category name.
- **Adding Links**: Navigate to the desired category, click "Edit Links," enter the link title and URL, and click "Add Link."
- **Deleting Links**: Click the "Delete" button next to any link in a category.
- **Searching Links**: Use the search bar to filter links by title.
- **Toggle Dark/Light Mode**: Click the "Toggle Mode" button to switch between themes.

## Code Overview

### HTML Structure

- The `header` contains the application title and buttons for category actions and dark/light mode toggle.
- The `container` holds individual `section` elements representing different categories, each containing:
  - A title
  - An "Edit Links" button
  - A navigation area for links
  - A form to add new links

### CSS Styles

- Base styles reset default margins and paddings, ensuring a consistent layout.
- Flexbox is used to create responsive layouts for sections and link containers.
- Media queries adjust styles for different screen sizes, providing a mobile-friendly interface.

### JavaScript Functionality

- Handles adding, editing, deleting categories and links.
- Implements local storage to save user data.
- Allows users to toggle between dark and light themes.

## Contribution

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by various link management tools and user feedback to create an intuitive interface.
