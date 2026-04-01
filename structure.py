import tkinter as tk
from tkinter import filedialog, scrolledtext, messagebox
import os

class FolderStructureGUI: 
    def __init__(self, root):
        self.root = root
        self.root.title("Folder Structure Generator")
        self.root.geometry("800x600") 
        
        # Variables
        self.folder_path = tk.StringVar()
        self.include_hidden = tk.BooleanVar(value=False)
        self.show_paths = tk.BooleanVar(value=False)
        self.include_files = tk.BooleanVar(value=True)
        
        # Define directories to ignore
        self.ignore_list = {
            'venv', '.venv', 'env', '.env', 
            '__pycache__', '.git', '.idea', '.vscode', 
            'node_modules', '.pytest_cache', '.DS_Store'
        }
        
        self.create_widgets()

    def create_widgets(self):
        control_frame = tk.Frame(self.root)
        control_frame.pack(pady=10, padx=10, fill="x")
        
        tk.Label(control_frame, text="Folder:").grid(row=0, column=0, sticky="w")
        tk.Entry(control_frame, textvariable=self.folder_path, width=50).grid(row=0, column=1, padx=5)
        tk.Button(control_frame, text="Browse", command=self.browse_folder).grid(row=0, column=2, padx=5)
        
        options_frame = tk.LabelFrame(self.root, text="Options", padx=10, pady=10)
        options_frame.pack(pady=10, padx=10, fill="x")
        
        tk.Checkbutton(options_frame, text="Include hidden files/folders", 
                      variable=self.include_hidden).grid(row=0, column=0, sticky="w", padx=5)
        tk.Checkbutton(options_frame, text="Show full paths", 
                      variable=self.show_paths).grid(row=0, column=1, sticky="w", padx=5)
        tk.Checkbutton(options_frame, text="Include files", 
                      variable=self.include_files).grid(row=0, column=2, sticky="w", padx=5)
        
        button_frame = tk.Frame(self.root)
        button_frame.pack(pady=10)
        
        tk.Button(button_frame, text="Generate Structure", 
                 command=self.generate_structure, bg="lightblue").pack(side="left", padx=5)
        tk.Button(button_frame, text="Save as Text", 
                 command=self.save_as_text).pack(side="left", padx=5)
        tk.Button(button_frame, text="Clear", 
                 command=self.clear_output, bg="lightcoral").pack(side="left", padx=5)
        
        output_frame = tk.LabelFrame(self.root, text="Folder Structure", padx=10, pady=10)
        output_frame.pack(pady=10, padx=10, fill="both", expand=True)
        
        self.output_text = scrolledtext.ScrolledText(output_frame, wrap="none", font=("Courier New", 10))
        self.output_text.pack(fill="both", expand=True)
        
        self.status_bar = tk.Label(self.root, text="Ready", bd=1, relief=tk.SUNKEN, anchor=tk.W)
        self.status_bar.pack(side=tk.BOTTOM, fill=tk.X)
     
    def browse_folder(self):
        folder = filedialog.askdirectory()
        if folder:
            self.folder_path.set(folder)
            
    def generate_structure(self):
        folder = self.folder_path.get()
        if not folder or not os.path.exists(folder):
            messagebox.showerror("Error", "Please select a valid folder!")
            return
            
        self.output_text.delete(1.0, tk.END)
        self.status_bar.config(text="Generating structure...")
        self.root.update()
        
        # Start recursion
        structure_lines = [os.path.basename(folder) + "/"]
        self.get_folder_structure(folder, "", structure_lines)
        
        self.output_text.insert(1.0, "\n".join(structure_lines))
        self.status_bar.config(text=f"Done. Folder: {folder}")
        
    def get_folder_structure(self, path, prefix, lines):
        """
        Recursive function using prefix strings for visual tree lines.
        """
        try:
            # Filter items based on hidden settings and ignore list
            all_items = os.listdir(path)
            items = []
            for item in all_items:
                if not self.include_hidden.get() and item.startswith('.'):
                    continue
                if item in self.ignore_list:
                    continue
                if not self.include_files.get() and os.path.isfile(os.path.join(path, item)):
                    continue
                items.append(item)

            # Sort: Folders first, then files
            items.sort(key=lambda x: (not os.path.isdir(os.path.join(path, x)), x.lower()))
            
            count = len(items)
            for i, item in enumerate(items):
                item_path = os.path.join(path, item)
                is_last = (i == count - 1)
                
                connector = "└── " if is_last else "├── "
                display_name = item
                
                if self.show_paths.get() and os.path.isfile(item_path):
                    display_name = f"{item} ({item_path})"
                
                if os.path.isdir(item_path):
                    lines.append(f"{prefix}{connector}{display_name}/")
                    # Extend prefix for children
                    new_prefix = prefix + ("    " if is_last else "│   ")
                    self.get_folder_structure(item_path, new_prefix, lines)
                else:
                    lines.append(f"{prefix}{connector}{display_name}")
                    
        except PermissionError:
            lines.append(f"{prefix}└── [Permission Denied]")
        except Exception as e:
            lines.append(f"{prefix}└── [Error: {str(e)}]")

    def save_as_text(self):
        content = self.output_text.get(1.0, tk.END)
        if not content.strip():
            messagebox.showwarning("Warning", "No content to save!")
            return
            
        file_path = filedialog.asksaveasfilename(
            defaultextension=".txt",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")]
        )
        
        if file_path:
            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                self.status_bar.config(text=f"Saved to: {file_path}")
            except Exception as e:
                messagebox.showerror("Error", f"Failed to save file: {str(e)}")
                
    def clear_output(self):
        self.output_text.delete(1.0, tk.END)
        self.status_bar.config(text="Ready")

if __name__ == "__main__":
    root = tk.Tk()
    app = FolderStructureGUI(root)
    root.mainloop()