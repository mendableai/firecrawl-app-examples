import os
import tempfile
import networkx as nx
from pyvis.network import Network
import uuid


class ClientGraphRenderer:
    """Renders a company client tree as an interactive graph."""

    def __init__(self, node_spacing=200, repulsion_strength=800, canvas_padding=150):
        """
        Initialize the renderer with customizable layout parameters.

        Args:
            node_spacing (int): Distance between connected nodes (higher = more spread out)
            repulsion_strength (int): Force of repulsion between nodes (higher = more space)
            canvas_padding (int): Padding around the graph (higher = more empty space at edges)
        """
        self.node_spacing = node_spacing
        self.repulsion_strength = repulsion_strength
        self.canvas_padding = canvas_padding
        self.output_dir = tempfile.gettempdir()

    def render_graph(self, company, width="100%", height="800px"):
        """
        Render a company client tree as an interactive graph.

        Args:
            company: The root company object with its client tree
            width: Width of the graph
            height: Height of the graph

        Returns:
            Path to the HTML file
        """
        # Create a network graph
        graph = Network(
            height=height,
            width=width,
            directed=True,
            bgcolor="#ffffff",
            font_color="#000000",
        )

        # Set graph physics for better visualization
        graph.barnes_hut(
            gravity=-80000,
            central_gravity=0.2,
            spring_length=300,
            spring_strength=0.002,
            damping=0.09,
            overlap=0.1,
        )

        # Add custom CSS to control the container appearance
        graph.set_options(
            """
        var options = {
            "layout": {
                "hierarchical": {
                    "enabled": false
                }
            },
            "physics": {
                "stabilization": {
                    "iterations": 100
                }
            },
            "edges": {
                "smooth": {
                    "type": "continuous",
                    "forceDirection": "none"
                },
                "color": {
                    "inherit": false,
                    "color": "#6E7B8B",
                    "opacity": 0.7
                },
                "width": 1.5
            },
            "interaction": {
                "hover": true,
                "multiselect": true,
                "navigationButtons": true
            }
        }
        """
        )

        # Recursively add nodes and edges
        self._add_company_to_graph(graph, company, is_root=True)

        # Generate unique filename
        output_path = os.path.join(
            self.output_dir, f"client_tree_{uuid.uuid4().hex}.html"
        )

        # Add custom HTML header to fix container issues
        html_head = """
        <style>
            body, html, #mynetwork {
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                overflow: hidden;
            }
            .vis-network {
                border: 1px solid #ddd;
                border-radius: 4px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
        </style>
        """

        # Save the graph to a file
        graph.save_graph(output_path)

        # Read the file and modify it to add our custom header
        with open(output_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Insert our custom head section
        modified_content = content.replace("<head>", f"<head>{html_head}")

        # Write back the modified content
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(modified_content)

        return output_path

    def _add_company_to_graph(self, graph, company, parent_id=None, is_root=False):
        """
        Recursively add a company and its clients to the graph.

        Args:
            graph: The network graph
            company: The company to add
            parent_id: ID of the parent company (for edge creation)
            is_root: Whether this is the root company
        """
        # Skip if company is None (should not happen but just in case)
        if company is None:
            return

        # Create a unique ID for this company based on its URL
        company_id = company.website_url

        # Skip if we've already added this node (prevents cycles)
        if company_id in [node["id"] for node in graph.nodes]:
            # If we haven't added the edge yet, add it
            if parent_id:
                graph.add_edge(parent_id, company_id, arrows="to", width=1.5)
            return

        # Prepare node properties
        node_props = {
            "label": company.name,
            "title": f"<div style='padding: 10px; max-width: 300px;'><strong>{company.name}</strong><br><a href='{company.website_url}' target='_blank'>{company.website_url}</a>{'' if len(company.clients) == 0 else f'<br>Clients: {len(company.clients)}'}</div>",
            "shape": "dot",
            "size": 20 if is_root else 10,
            "color": {
                "background": "#3498db" if is_root else "#2ecc71",
                "border": "#2980b9" if is_root else "#27ae60",
                "highlight": {
                    "background": "#5DADE2" if is_root else "#58D68D",
                    "border": "#2980b9" if is_root else "#27ae60",
                },
            },
            "borderWidth": 3,
            "borderWidthSelected": 5,
            "font": {"size": 15 if is_root else 12, "face": "Arial", "bold": is_root},
            "shadow": {"enabled": True, "size": 5},
        }

        # Add the company node
        graph.add_node(company_id, **node_props)

        # If this is not the root, add an edge from parent to this company
        if parent_id:
            graph.add_edge(
                parent_id,
                company_id,
                arrows="to",
                width=1.5,
                smooth={"type": "curvedCW", "roundness": 0.2},
            )

        # Recursively add all clients
        for client in company.clients:
            self._add_company_to_graph(graph, client, parent_id=company_id)
