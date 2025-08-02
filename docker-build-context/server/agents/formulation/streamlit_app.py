import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import json
import requests
from datetime import datetime, timedelta

# RDKit imports for chemical informatics
try:
    from rdkit import Chem
    from rdkit.Chem import Descriptors, rdMolDescriptors, Draw, AllChem
    from rdkit.Chem.Draw import rdMolDraw2D
    import io
    import base64
    RDKIT_AVAILABLE = True
except ImportError:
    RDKIT_AVAILABLE = False
    st.warning("RDKit not available. Some chemical analysis features will be limited.")

# Configure page
st.set_page_config(
    page_title="Formul8 - Formulation Agent Dashboard",
    page_icon="🧪",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for cannabis industry theme
st.markdown("""
<style>
    .main-header {
        background: linear-gradient(90deg, #2d5016 0%, #4a7c27 100%);
        padding: 1rem;
        border-radius: 10px;
        margin-bottom: 2rem;
    }
    .metric-card {
        background: white;
        padding: 1rem;
        border-radius: 8px;
        border-left: 4px solid #4a7c27;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .cannabis-green { color: #4a7c27; }
    .alert-warning { 
        background-color: #fff3cd; 
        border: 1px solid #ffeaa7; 
        padding: 0.75rem; 
        border-radius: 5px; 
    }
</style>
""", unsafe_allow_html=True)

def main():
    # Header
    st.markdown('<div class="main-header">', unsafe_allow_html=True)
    st.title("🧪 Formulation Agent Dashboard")
    st.markdown("**Cannabis Product Development & Chemistry Analysis**")
    st.markdown('</div>', unsafe_allow_html=True)
    
    # Sidebar navigation
    st.sidebar.title("Navigation")
    page = st.sidebar.selectbox("Select Page", [
        "🏠 Dashboard",
        "🧬 Formulation Designer", 
        "📊 Batch Analysis",
        "🔬 Potency Calculator",
        "📈 Stability Testing",
        "🎯 Compliance Check",
        "📋 Recipe Library",
        "⚗️ Molecular Analysis"
    ])
    
    if page == "🏠 Dashboard":
        show_dashboard()
    elif page == "🧬 Formulation Designer":
        show_formulation_designer()
    elif page == "📊 Batch Analysis":
        show_batch_analysis()
    elif page == "🔬 Potency Calculator":
        show_potency_calculator()
    elif page == "📈 Stability Testing":
        show_stability_testing()
    elif page == "🎯 Compliance Check":
        show_compliance_check()
    elif page == "📋 Recipe Library":
        show_recipe_library()
    elif page == "⚗️ Molecular Analysis":
        show_molecular_analysis()

def show_dashboard():
    st.header("📊 Formulation Agent Overview")
    
    # Key metrics
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric(
            label="Active Formulations",
            value="24",
            delta="3 new this week"
        )
    
    with col2:
        st.metric(
            label="Compliance Rate",
            value="98.5%",
            delta="2.1%"
        )
    
    with col3:
        st.metric(
            label="Avg THC Accuracy",
            value="±0.3%",
            delta="-0.1%"
        )
    
    with col4:
        st.metric(
            label="Stability Tests",
            value="89",
            delta="12 completed"
        )
    
    # Recent activity and charts
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Recent Formulation Activity")
        
        # Sample activity data
        activity_data = [
            {"Time": "2 hours ago", "Action": "Gummy formulation optimized", "Type": "Optimization"},
            {"Time": "4 hours ago", "Action": "New tincture recipe validated", "Type": "Validation"},
            {"Time": "6 hours ago", "Action": "Potency calculation completed", "Type": "Analysis"},
            {"Time": "8 hours ago", "Action": "Stability test initiated", "Type": "Testing"},
            {"Time": "12 hours ago", "Action": "Compliance check passed", "Type": "Compliance"}
        ]
        
        for activity in activity_data:
            with st.container():
                st.markdown(f"**{activity['Time']}** - {activity['Action']}")
                st.caption(f"Type: {activity['Type']}")
                st.divider()
    
    with col2:
        st.subheader("Formulation Success Rate")
        
        # Sample success rate data
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
        success_rates = [92, 94, 96, 93, 97, 98]
        
        fig = px.line(
            x=months, 
            y=success_rates,
            title="Monthly Formulation Success Rate",
            labels={'x': 'Month', 'y': 'Success Rate (%)'}
        )
        fig.update_traces(line_color='#4a7c27', line_width=3)
        fig.update_layout(showlegend=False)
        st.plotly_chart(fig, use_container_width=True)

def show_formulation_designer():
    st.header("🧬 Interactive Formulation Designer")
    
    col1, col2 = st.columns([1, 2])
    
    with col1:
        st.subheader("Product Parameters")
        
        product_type = st.selectbox(
            "Product Type",
            ["Gummies", "Chocolate", "Tincture", "Capsules", "Topical", "Vape Oil"]
        )
        
        target_thc = st.slider("Target THC (mg)", 0, 100, 10)
        target_cbd = st.slider("Target CBD (mg)", 0, 100, 5)
        
        batch_size = st.number_input("Batch Size (units)", min_value=1, value=1000)
        
        # Advanced options
        with st.expander("Advanced Formulation Options"):
            terpene_profile = st.selectbox(
                "Terpene Profile",
                ["None", "Relaxing (Myrcene)", "Energizing (Limonene)", "Focus (Pinene)", "Custom"]
            )
            
            if terpene_profile == "Custom":
                st.text_area("Custom Terpene Blend", placeholder="Enter terpene ratios...")
            
            preservatives = st.multiselect(
                "Preservatives",
                ["Potassium Sorbate", "Sodium Benzoate", "Citric Acid", "Ascorbic Acid"]
            )
            
            shelf_life_target = st.slider("Target Shelf Life (months)", 3, 24, 12)
    
    with col2:
        st.subheader("Formulation Results")
        
        if st.button("Generate Formulation", type="primary"):
            with st.spinner("Calculating optimal formulation..."):
                # Simulate formulation calculation
                import time
                time.sleep(2)
                
                # Display results
                st.success("Formulation calculated successfully!")
                
                # Base ingredients calculation
                if product_type == "Gummies":
                    base_weight = 5  # grams per gummy
                    total_base = batch_size * base_weight
                    
                    ingredients = {
                        "Cannabis Oil (mg)": target_thc + target_cbd,
                        "Gelatin (g)": total_base * 0.15,
                        "Sugar (g)": total_base * 0.35,
                        "Corn Syrup (g)": total_base * 0.25,
                        "Water (ml)": total_base * 0.20,
                        "Flavoring (ml)": total_base * 0.02,
                        "Citric Acid (g)": total_base * 0.01
                    }
                    
                    # Display ingredient table
                    df = pd.DataFrame([
                        {"Ingredient": k, "Amount": f"{v:.2f}", "Percentage": f"{(v/total_base)*100:.1f}%"}
                        for k, v in ingredients.items()
                    ])
                    
                    st.dataframe(df, use_container_width=True)
                    
                    # Nutritional info
                    st.subheader("Nutritional Information (per unit)")
                    nutrition_col1, nutrition_col2 = st.columns(2)
                    
                    with nutrition_col1:
                        st.metric("Calories", "20")
                        st.metric("Total Carbs", "5g")
                    
                    with nutrition_col2:
                        st.metric("THC", f"{target_thc}mg")
                        st.metric("CBD", f"{target_cbd}mg")
                
                # Cost analysis
                st.subheader("Cost Analysis")
                cost_per_unit = 0.45  # Sample cost
                total_cost = batch_size * cost_per_unit
                
                cost_col1, cost_col2, cost_col3 = st.columns(3)
                with cost_col1:
                    st.metric("Cost per Unit", f"${cost_per_unit:.2f}")
                with cost_col2:
                    st.metric("Total Batch Cost", f"${total_cost:.2f}")
                with cost_col3:
                    st.metric("Profit Margin", "65%")

def show_batch_analysis():
    st.header("📊 Batch Analysis & Quality Control")
    
    # Upload section
    st.subheader("Upload Batch Data")
    uploaded_file = st.file_uploader(
        "Upload CSV with batch test results",
        type=['csv'],
        help="CSV should contain columns: batch_id, thc_mg, cbd_mg, weight_g, moisture_%, test_date"
    )
    
    if uploaded_file is not None:
        df = pd.read_csv(uploaded_file)
        st.success(f"Loaded {len(df)} batch records")
        
        # Display data summary
        st.dataframe(df.head(), use_container_width=True)
        
        # Analysis charts
        col1, col2 = st.columns(2)
        
        with col1:
            if 'thc_mg' in df.columns:
                fig = px.histogram(
                    df, 
                    x='thc_mg', 
                    title="THC Distribution Across Batches",
                    nbins=20
                )
                fig.update_traces(marker_color='#4a7c27')
                st.plotly_chart(fig, use_container_width=True)
        
        with col2:
            if 'cbd_mg' in df.columns:
                fig = px.histogram(
                    df, 
                    x='cbd_mg', 
                    title="CBD Distribution Across Batches",
                    nbins=20
                )
                fig.update_traces(marker_color='#2d5016')
                st.plotly_chart(fig, use_container_width=True)
    
    else:
        # Show sample data for demonstration
        st.info("Upload a CSV file to analyze your batch data, or view sample analysis below:")
        
        # Generate sample data
        np.random.seed(42)
        sample_data = pd.DataFrame({
            'batch_id': [f"BTH{1000+i}" for i in range(50)],
            'thc_mg': np.random.normal(10, 0.5, 50),
            'cbd_mg': np.random.normal(5, 0.3, 50),
            'weight_g': np.random.normal(5.0, 0.1, 50),
            'moisture_%': np.random.normal(12, 1, 50)
        })
        
        col1, col2 = st.columns(2)
        
        with col1:
            fig = px.scatter(
                sample_data,
                x='thc_mg',
                y='cbd_mg',
                title="THC vs CBD Content Analysis",
                labels={'thc_mg': 'THC (mg)', 'cbd_mg': 'CBD (mg)'}
            )
            fig.update_traces(marker_color='#4a7c27')
            st.plotly_chart(fig, use_container_width=True)
        
        with col2:
            fig = px.box(
                sample_data,
                y='weight_g',
                title="Weight Consistency Analysis"
            )
            fig.update_traces(marker_color='#4a7c27')
            st.plotly_chart(fig, use_container_width=True)

def show_potency_calculator():
    st.header("🔬 Cannabis Potency Calculator")
    
    tab1, tab2, tab3 = st.tabs(["Basic Calculator", "Decarboxylation", "Extraction Efficiency"])
    
    with tab1:
        st.subheader("Basic Potency Calculation")
        
        col1, col2 = st.columns(2)
        
        with col1:
            flower_weight = st.number_input("Flower Weight (grams)", min_value=0.0, value=1.0, step=0.1)
            thc_percentage = st.number_input("THC % (from COA)", min_value=0.0, max_value=50.0, value=20.0, step=0.1)
            cbd_percentage = st.number_input("CBD % (from COA)", min_value=0.0, max_value=50.0, value=1.0, step=0.1)
            
            decarb_efficiency = st.slider("Decarboxylation Efficiency", 0, 100, 87, help="Typical range: 80-95%")
            extraction_efficiency = st.slider("Extraction Efficiency", 0, 100, 75, help="Depends on method: Alcohol ~75%, Oil ~60%")
        
        with col2:
            if st.button("Calculate Potency"):
                # Calculate total cannabinoids
                total_thc_mg = (flower_weight * 1000) * (thc_percentage / 100) * (decarb_efficiency / 100) * (extraction_efficiency / 100)
                total_cbd_mg = (flower_weight * 1000) * (cbd_percentage / 100) * (decarb_efficiency / 100) * (extraction_efficiency / 100)
                
                st.success("Calculation Complete!")
                
                # Results
                st.metric("Total THC Available", f"{total_thc_mg:.1f} mg")
                st.metric("Total CBD Available", f"{total_cbd_mg:.1f} mg")
                
                # Dosing recommendations
                st.subheader("Dosing Recommendations")
                
                # Calculate servings for different dose levels
                doses = [2.5, 5, 10, 20]
                for dose in doses:
                    servings = total_thc_mg / dose
                    st.write(f"**{dose}mg THC doses:** {servings:.0f} servings")
    
    with tab2:
        st.subheader("Decarboxylation Calculator")
        
        st.info("Decarboxylation converts THCA to THC. Different time/temperature combinations yield different efficiencies.")
        
        temp_f = st.selectbox(
            "Temperature (°F)",
            [200, 220, 240, 250, 260, 280],
            index=2
        )
        
        time_min = st.slider("Time (minutes)", 15, 120, 40)
        
        # Decarb efficiency calculation (simplified model)
        if temp_f == 240 and time_min == 40:
            efficiency = 87
        elif temp_f == 220:
            efficiency = max(70, 85 - (40 - time_min) * 0.5)
        elif temp_f == 250:
            efficiency = min(90, 87 + (time_min - 40) * 0.1)
        else:
            efficiency = 75  # Default
        
        st.metric("Estimated Decarb Efficiency", f"{efficiency:.1f}%")
        
        # Efficiency chart
        temps = [200, 220, 240, 250, 260, 280]
        efficiencies = [65, 75, 87, 89, 85, 80]  # Sample data
        
        fig = go.Figure()
        fig.add_trace(go.Scatter(x=temps, y=efficiencies, mode='lines+markers', name='Efficiency'))
        fig.update_layout(
            title="Decarboxylation Efficiency by Temperature",
            xaxis_title="Temperature (°F)",
            yaxis_title="Efficiency (%)"
        )
        st.plotly_chart(fig, use_container_width=True)
    
    with tab3:
        st.subheader("Extraction Efficiency Guide")
        
        extraction_method = st.selectbox(
            "Extraction Method",
            ["Ethanol/Alcohol", "CO2", "Coconut Oil", "Butter", "Rosin Press"]
        )
        
        efficiencies = {
            "Ethanol/Alcohol": {"efficiency": 75, "notes": "Good for tinctures, full spectrum"},
            "CO2": {"efficiency": 85, "notes": "Clean, precise, expensive equipment"},
            "Coconut Oil": {"efficiency": 60, "notes": "Good for edibles, long shelf life"},
            "Butter": {"efficiency": 55, "notes": "Traditional, requires refrigeration"},
            "Rosin Press": {"efficiency": 70, "notes": "Solventless, preserves terpenes"}
        }
        
        method_data = efficiencies[extraction_method]
        
        col1, col2 = st.columns(2)
        with col1:
            st.metric("Typical Efficiency", f"{method_data['efficiency']}%")
        with col2:
            st.info(method_data['notes'])

def show_stability_testing():
    st.header("📈 Stability Testing Dashboard")
    
    st.info("Monitor cannabinoid degradation and product stability over time")
    
    # Sample stability data
    days = list(range(0, 365, 30))
    thc_retention = [100, 98, 95, 92, 88, 84, 79, 74, 68, 62, 55, 48, 40]
    cbd_retention = [100, 99, 97, 95, 93, 90, 87, 83, 79, 74, 69, 63, 57]
    
    # Create stability chart
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=days, y=thc_retention, mode='lines+markers', name='THC Retention', line=dict(color='#4a7c27')))
    fig.add_trace(go.Scatter(x=days, y=cbd_retention, mode='lines+markers', name='CBD Retention', line=dict(color='#2d5016')))
    
    fig.update_layout(
        title="Cannabinoid Stability Over Time",
        xaxis_title="Days",
        yaxis_title="Retention (%)",
        hovermode='x unified'
    )
    
    st.plotly_chart(fig, use_container_width=True)
    
    # Storage conditions
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.subheader("Storage Conditions")
        storage_temp = st.select_slider("Temperature", options=["Frozen", "Refrigerated", "Room Temp", "Warm"], value="Room Temp")
        light_exposure = st.selectbox("Light Exposure", ["Dark", "Ambient", "Direct Light"])
        humidity = st.slider("Humidity (%)", 0, 100, 45)
    
    with col2:
        st.subheader("Predicted Shelf Life")
        # Simple shelf life calculation based on conditions
        base_shelf_life = 12  # months
        
        temp_factor = {"Frozen": 2.0, "Refrigerated": 1.5, "Room Temp": 1.0, "Warm": 0.6}[storage_temp]
        light_factor = {"Dark": 1.2, "Ambient": 1.0, "Direct Light": 0.7}[light_exposure]
        humidity_factor = 1.0 if 30 <= humidity <= 60 else 0.8
        
        predicted_shelf_life = base_shelf_life * temp_factor * light_factor * humidity_factor
        
        st.metric("Estimated Shelf Life", f"{predicted_shelf_life:.1f} months")
        
        if predicted_shelf_life < 6:
            st.warning("⚠️ Poor storage conditions detected")
        elif predicted_shelf_life > 18:
            st.success("✅ Excellent storage conditions")
        else:
            st.info("ℹ️ Acceptable storage conditions")
    
    with col3:
        st.subheader("Degradation Factors")
        st.write("**Primary factors affecting stability:**")
        st.write("• Temperature (most critical)")
        st.write("• Light exposure")
        st.write("• Oxygen exposure")
        st.write("• Humidity levels")
        st.write("• pH levels")
        st.write("• Packaging materials")

def show_compliance_check():
    st.header("🎯 Compliance Verification")
    
    st.subheader("Product Compliance Checklist")
    
    # Jurisdiction selection
    jurisdiction = st.selectbox(
        "Select Jurisdiction",
        ["California", "Colorado", "Oregon", "Washington", "Nevada", "Michigan", "Illinois"]
    )
    
    product_type = st.selectbox(
        "Product Type",
        ["Edibles", "Concentrates", "Flower", "Topicals", "Tinctures"]
    )
    
    # Sample compliance requirements based on jurisdiction and product type
    if jurisdiction == "California" and product_type == "Edibles":
        requirements = {
            "THC per serving ≤ 10mg": True,
            "THC per package ≤ 100mg": True,
            "Child-resistant packaging": True,
            "Warning labels present": True,
            "Nutritional information": False,
            "Allergen declarations": True,
            "COA attached": True
        }
    else:
        # Default requirements
        requirements = {
            "Proper labeling": True,
            "Dosage compliance": True,
            "Testing requirements": True,
            "Packaging standards": False,
            "Track and trace": True
        }
    
    st.subheader(f"Compliance Requirements - {jurisdiction}")
    
    compliance_score = 0
    total_requirements = len(requirements)
    
    for requirement, status in requirements.items():
        col1, col2 = st.columns([3, 1])
        with col1:
            st.write(requirement)
        with col2:
            if status:
                st.success("✅ Pass")
                compliance_score += 1
            else:
                st.error("❌ Fail")
    
    # Overall compliance score
    score_percentage = (compliance_score / total_requirements) * 100
    
    st.subheader("Compliance Score")
    st.progress(score_percentage / 100)
    st.metric("Overall Compliance", f"{score_percentage:.1f}%")
    
    if score_percentage == 100:
        st.success("🎉 Fully compliant! Ready for market.")
    elif score_percentage >= 80:
        st.warning("⚠️ Minor compliance issues detected. Address before market entry.")
    else:
        st.error("🚫 Major compliance issues. Product not ready for market.")

def show_recipe_library():
    st.header("📋 Formulation Recipe Library")
    
    # Search and filter
    col1, col2, col3 = st.columns(3)
    
    with col1:
        search_term = st.text_input("Search recipes", placeholder="e.g., gummy, chocolate")
    
    with col2:
        category_filter = st.selectbox("Category", ["All", "Edibles", "Beverages", "Topicals", "Tinctures"])
    
    with col3:
        potency_filter = st.selectbox("Potency Range", ["All", "Micro (0-2mg)", "Low (2-10mg)", "Medium (10-25mg)", "High (25mg+)"])
    
    # Sample recipe data
    recipes = [
        {
            "name": "Classic Cannabis Gummies",
            "category": "Edibles",
            "thc_mg": 10,
            "cbd_mg": 0,
            "yield": 100,
            "difficulty": "Easy",
            "time": "2 hours",
            "rating": 4.8
        },
        {
            "name": "Full Spectrum Chocolate Bar",
            "category": "Edibles", 
            "thc_mg": 5,
            "cbd_mg": 5,
            "yield": 20,
            "difficulty": "Medium",
            "time": "3 hours",
            "rating": 4.6
        },
        {
            "name": "CBD Relief Balm",
            "category": "Topicals",
            "thc_mg": 0,
            "cbd_mg": 50,
            "yield": 50,
            "difficulty": "Easy",
            "time": "1 hour",
            "rating": 4.9
        },
        {
            "name": "Nano-Emulsion Tincture",
            "category": "Tinctures",
            "thc_mg": 25,
            "cbd_mg": 25,
            "yield": 30,
            "difficulty": "Hard",
            "time": "4 hours",
            "rating": 4.7
        }
    ]
    
    # Display recipes
    for recipe in recipes:
        # Apply filters
        if search_term and search_term.lower() not in recipe["name"].lower():
            continue
        if category_filter != "All" and recipe["category"] != category_filter:
            continue
        
        with st.expander(f"🧪 {recipe['name']} - {recipe['thc_mg']}mg THC / {recipe['cbd_mg']}mg CBD"):
            col1, col2, col3, col4 = st.columns(4)
            
            with col1:
                st.metric("THC per unit", f"{recipe['thc_mg']}mg")
                st.metric("CBD per unit", f"{recipe['cbd_mg']}mg")
            
            with col2:
                st.metric("Yield", f"{recipe['yield']} units")
                st.metric("Difficulty", recipe['difficulty'])
            
            with col3:
                st.metric("Prep Time", recipe['time'])
                st.metric("Rating", f"{recipe['rating']}/5.0")
            
            with col4:
                if st.button(f"Use Recipe", key=f"use_{recipe['name']}"):
                    st.success(f"Recipe '{recipe['name']}' loaded into formulation designer!")
                
                if st.button(f"View Details", key=f"view_{recipe['name']}"):
                    st.info("Full recipe details would be displayed here...")

def show_molecular_analysis():
    st.header("⚗️ Molecular Analysis & Cannabis Chemistry")
    
    if not RDKIT_AVAILABLE:
        st.error("RDKit is required for molecular analysis features. Please install rdkit-pypi.")
        return
    
    tab1, tab2, tab3, tab4 = st.tabs(["Cannabinoid Analysis", "Terpene Profiling", "Molecular Properties", "Structure Viewer"])
    
    with tab1:
        st.subheader("Cannabinoid Molecular Analysis")
        
        # Cannabinoid SMILES database
        cannabinoids = {
            "THC (Δ9-tetrahydrocannabinol)": "CCCCCc1cc(c2c(c1)OC(C3C2C(=O)C=C3C)(C)C)O",
            "CBD (Cannabidiol)": "CCCCCc1cc(c2c(c1)OC(C3C2C=C(CC3)C)(C)C)O",
            "CBG (Cannabigerol)": "CCCCCc1cc(c2c(c1)OC(C=C2C)(C)C)O",
            "CBC (Cannabichromene)": "CCCCCc1cc2c(c(c1)O)OC(C(=C2)C)(C)C",
            "CBN (Cannabinol)": "CCCCCc1cc2c3c(c1)OC(C4C3C(=CC=C4C)O2)(C)C",
            "THCA (THC Acid)": "CCCCCc1cc(c2c(c1)OC(C3C2C(=O)C=C3C(=O)O)(C)C)O",
            "CBDA (CBD Acid)": "CCCCCc1cc(c2c(c1)OC(C3C2C=C(CC3)C(=O)O)(C)C)O"
        }
        
        selected_cannabinoid = st.selectbox("Select Cannabinoid", list(cannabinoids.keys()))
        
        if selected_cannabinoid:
            smiles = cannabinoids[selected_cannabinoid]
            mol = Chem.MolFromSmiles(smiles)
            
            if mol:
                col1, col2 = st.columns(2)
                
                with col1:
                    # Display molecular structure
                    st.subheader("Molecular Structure")
                    img = Draw.MolToImage(mol, size=(400, 400))
                    st.image(img, caption=selected_cannabinoid)
                
                with col2:
                    # Calculate molecular properties
                    st.subheader("Molecular Properties")
                    
                    mw = Descriptors.MolWt(mol)
                    logp = Descriptors.MolLogP(mol)
                    hbd = Descriptors.NumHDonors(mol)
                    hba = Descriptors.NumHAcceptors(mol)
                    tpsa = Descriptors.TPSA(mol)
                    
                    st.metric("Molecular Weight", f"{mw:.2f} g/mol")
                    st.metric("LogP (Lipophilicity)", f"{logp:.2f}")
                    st.metric("H-Bond Donors", int(hbd))
                    st.metric("H-Bond Acceptors", int(hba))
                    st.metric("Polar Surface Area", f"{tpsa:.2f} Ų")
                    
                    # Bioavailability assessment
                    st.subheader("Bioavailability Assessment")
                    lipinski_violations = 0
                    if mw > 500: lipinski_violations += 1
                    if logp > 5: lipinski_violations += 1
                    if hbd > 5: lipinski_violations += 1
                    if hba > 10: lipinski_violations += 1
                    
                    if lipinski_violations == 0:
                        st.success("✅ Passes Lipinski's Rule of Five")
                    else:
                        st.warning(f"⚠️ {lipinski_violations} Lipinski violations")
    
    with tab2:
        st.subheader("Terpene Profile Analysis")
        
        # Common cannabis terpenes
        terpenes = {
            "Myrcene": "CC(=CCCC(=CCCO)C)C",
            "Limonene": "CC(=C)C1CC=C(CC1)C",
            "Pinene": "CC1=CCC2CC1C2(C)C",
            "Linalool": "CC(C)(C=C)CCC(C)(CCO)O",
            "Caryophyllene": "CC1=CCCC(=C)C2CCC(=C)C2CC1",
            "Humulene": "CC1=CCCC(CC=C(CCC=C1)C)C",
            "Terpinolene": "CC1=CCC(=C(C)C)CC1",
            "Ocimene": "CC(=CCCC(=CC)C)C"
        }
        
        col1, col2 = st.columns(2)
        
        with col1:
            selected_terpenes = st.multiselect("Select Terpenes for Analysis", list(terpenes.keys()))
            
            if selected_terpenes:
                terpene_data = []
                for terpene in selected_terpenes:
                    smiles = terpenes[terpene]
                    mol = Chem.MolFromSmiles(smiles)
                    if mol:
                        mw = Descriptors.MolWt(mol)
                        bp = Descriptors.BertzCT(mol)  # Complexity as proxy for boiling point
                        terpene_data.append({
                            "Terpene": terpene,
                            "Molecular Weight": f"{mw:.2f}",
                            "Complexity": f"{bp:.1f}",
                            "Volatility": "High" if mw < 150 else "Medium" if mw < 180 else "Low"
                        })
                
                df = pd.DataFrame(terpene_data)
                st.dataframe(df, use_container_width=True)
        
        with col2:
            if selected_terpenes:
                st.subheader("Terpene Effects Profile")
                
                # Terpene effects database
                effects = {
                    "Myrcene": {"Sedating": 9, "Muscle Relaxant": 8, "Analgesic": 7},
                    "Limonene": {"Mood Elevation": 9, "Anti-anxiety": 8, "Focus": 6},
                    "Pinene": {"Alertness": 9, "Memory": 8, "Anti-inflammatory": 7},
                    "Linalool": {"Calming": 9, "Anti-anxiety": 8, "Sleep Aid": 8},
                    "Caryophyllene": {"Anti-inflammatory": 9, "Pain Relief": 8, "Neuroprotective": 7},
                    "Humulene": {"Appetite Suppressant": 8, "Anti-inflammatory": 7, "Antibacterial": 6},
                    "Terpinolene": {"Sedating": 7, "Antibacterial": 6, "Antioxidant": 7},
                    "Ocimene": {"Antiviral": 7, "Antifungal": 6, "Decongestant": 8}
                }
                
                combined_effects = {}
                for terpene in selected_terpenes:
                    if terpene in effects:
                        for effect, strength in effects[terpene].items():
                            if effect in combined_effects:
                                combined_effects[effect] = max(combined_effects[effect], strength)
                            else:
                                combined_effects[effect] = strength
                
                if combined_effects:
                    effects_df = pd.DataFrame([
                        {"Effect": effect, "Strength": strength}
                        for effect, strength in combined_effects.items()
                    ])
                    
                    fig = px.bar(
                        effects_df,
                        x="Strength",
                        y="Effect",
                        orientation="h",
                        title="Combined Terpene Effects Profile"
                    )
                    fig.update_traces(marker_color='#4a7c27')
                    st.plotly_chart(fig, use_container_width=True)
    
    with tab3:
        st.subheader("Molecular Properties Calculator")
        
        # Custom SMILES input
        custom_smiles = st.text_input(
            "Enter SMILES notation",
            placeholder="e.g., CCCCCc1cc(c2c(c1)OC(C3C2C(=O)C=C3C)(C)C)O",
            help="SMILES (Simplified Molecular Input Line Entry System) notation for molecular structure"
        )
        
        if custom_smiles:
            try:
                mol = Chem.MolFromSmiles(custom_smiles)
                if mol:
                    col1, col2, col3 = st.columns(3)
                    
                    with col1:
                        st.subheader("Basic Properties")
                        st.metric("Molecular Weight", f"{Descriptors.MolWt(mol):.2f} g/mol")
                        st.metric("Heavy Atom Count", Descriptors.HeavyAtomCount(mol))
                        st.metric("Ring Count", Descriptors.RingCount(mol))
                        st.metric("Aromatic Rings", Descriptors.NumAromaticRings(mol))
                    
                    with col2:
                        st.subheader("Lipophilicity & Solubility")
                        st.metric("LogP", f"{Descriptors.MolLogP(mol):.2f}")
                        st.metric("LogS (Solubility)", f"{Descriptors.MolLogP(mol)*-0.74:.2f}")
                        st.metric("TPSA", f"{Descriptors.TPSA(mol):.2f} Ų")
                        
                    with col3:
                        st.subheader("Hydrogen Bonding")
                        st.metric("H-Bond Donors", Descriptors.NumHDonors(mol))
                        st.metric("H-Bond Acceptors", Descriptors.NumHAcceptors(mol))
                        st.metric("Rotatable Bonds", Descriptors.NumRotatableBonds(mol))
                    
                    # Display structure
                    st.subheader("Molecular Structure")
                    img = Draw.MolToImage(mol, size=(600, 400))
                    st.image(img, caption="Custom Molecule Structure")
                    
                else:
                    st.error("Invalid SMILES notation. Please check your input.")
            except Exception as e:
                st.error(f"Error processing SMILES: {str(e)}")
    
    with tab4:
        st.subheader("Interactive Structure Viewer")
        
        # Comparison tool
        st.write("**Compare Cannabinoid Structures**")
        
        col1, col2 = st.columns(2)
        
        with col1:
            cannabinoid1 = st.selectbox("First Cannabinoid", list(cannabinoids.keys()), key="cb1")
            if cannabinoid1:
                mol1 = Chem.MolFromSmiles(cannabinoids[cannabinoid1])
                if mol1:
                    img1 = Draw.MolToImage(mol1, size=(350, 350))
                    st.image(img1, caption=cannabinoid1)
                    
                    # Key properties
                    st.metric("Molecular Weight", f"{Descriptors.MolWt(mol1):.1f} g/mol")
                    st.metric("LogP", f"{Descriptors.MolLogP(mol1):.2f}")
        
        with col2:
            cannabinoid2 = st.selectbox("Second Cannabinoid", list(cannabinoids.keys()), key="cb2")
            if cannabinoid2:
                mol2 = Chem.MolFromSmiles(cannabinoids[cannabinoid2])
                if mol2:
                    img2 = Draw.MolToImage(mol2, size=(350, 350))
                    st.image(img2, caption=cannabinoid2)
                    
                    # Key properties
                    st.metric("Molecular Weight", f"{Descriptors.MolWt(mol2):.1f} g/mol")
                    st.metric("LogP", f"{Descriptors.MolLogP(mol2):.2f}")
        
        # Structural similarity
        if cannabinoid1 and cannabinoid2 and cannabinoid1 != cannabinoid2:
            mol1 = Chem.MolFromSmiles(cannabinoids[cannabinoid1])
            mol2 = Chem.MolFromSmiles(cannabinoids[cannabinoid2])
            
            if mol1 and mol2:
                # Calculate Tanimoto similarity
                fp1 = AllChem.GetMorganFingerprintAsBitVect(mol1, 2, nBits=1024)
                fp2 = AllChem.GetMorganFingerprintAsBitVect(mol2, 2, nBits=1024)
                similarity = Chem.DataStructs.TanimotoSimilarity(fp1, fp2)
                
                st.subheader("Structural Similarity Analysis")
                st.metric("Tanimoto Similarity", f"{similarity:.3f}")
                
                if similarity > 0.8:
                    st.success("Very similar structures")
                elif similarity > 0.6:
                    st.info("Moderately similar structures")
                elif similarity > 0.4:
                    st.warning("Somewhat similar structures")
                else:
                    st.error("Very different structures")

if __name__ == "__main__":
    main()