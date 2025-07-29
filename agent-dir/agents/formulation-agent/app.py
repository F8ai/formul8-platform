import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from rdkit import Chem
from rdkit.Chem import Descriptors, Draw
import io
import base64

st.set_page_config(
    page_title="🧪 Formulation Agent - Molecular Analysis",
    page_icon="🧪",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.title("🧪 Formulation Agent - Molecular Analysis & Cannabis Formulation Design")

# Sidebar
st.sidebar.header("🔬 Analysis Tools")
analysis_type = st.sidebar.selectbox(
    "Select Analysis Type",
    ["Molecular Analysis", "Formulation Design", "Quality Control", "Extraction Optimization"]
)

if analysis_type == "Molecular Analysis":
    st.header("🧪 Molecular Property Analysis")
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.subheader("Input Structure")
        smiles_input = st.text_input(
            "Enter SMILES string:",
            value="CCCCCc1cc(O)c2c(c1)OC(C)(C)c1ccc(C)cc1-2",
            help="Example: THC molecule"
        )
        
        if smiles_input:
            mol = Chem.MolFromSmiles(smiles_input)
            if mol:
                st.success("✅ Valid molecule structure")
                
                # Calculate properties
                properties = {
                    "Molecular Weight": Descriptors.MolWt(mol),
                    "LogP": Descriptors.MolLogP(mol),
                    "TPSA": Descriptors.TPSA(mol),
                    "Rotatable Bonds": Descriptors.NumRotatableBonds(mol),
                    "H-Bond Donors": Descriptors.NumHDonors(mol),
                    "H-Bond Acceptors": Descriptors.NumHAcceptors(mol),
                    "Ring Count": Descriptors.RingCount(mol)
                }
                
                st.subheader("📊 Molecular Properties")
                props_df = pd.DataFrame(list(properties.items()), columns=["Property", "Value"])
                st.dataframe(props_df, use_container_width=True)
                
            else:
                st.error("❌ Invalid SMILES string")
    
    with col2:
        if smiles_input and mol:
            st.subheader("🔬 Molecular Visualization")
            
            # Generate molecule image
            img = Draw.MolToImage(mol, size=(400, 400))
            st.image(img, caption="Molecular Structure")
            
            # Property radar chart
            st.subheader("📈 Property Profile")
            
            # Normalize properties for radar chart
            normalized_props = {
                "MW": min(properties["Molecular Weight"] / 500, 1),
                "LogP": (properties["LogP"] + 5) / 10,  # Scale -5 to 5 → 0 to 1
                "TPSA": min(properties["TPSA"] / 200, 1),
                "Flexibility": min(properties["Rotatable Bonds"] / 20, 1),
                "H-Donors": min(properties["H-Bond Donors"] / 10, 1),
                "H-Acceptors": min(properties["H-Bond Acceptors"] / 10, 1)
            }
            
            fig = go.Figure()
            fig.add_trace(go.Scatterpolar(
                r=list(normalized_props.values()),
                theta=list(normalized_props.keys()),
                fill='toself',
                name='Properties'
            ))
            
            fig.update_layout(
                polar=dict(
                    radialaxis=dict(
                        visible=True,
                        range=[0, 1]
                    )),
                showlegend=True,
                height=400
            )
            
            st.plotly_chart(fig, use_container_width=True)

elif analysis_type == "Formulation Design":
    st.header("🌿 Cannabis Formulation Design")
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.subheader("🎯 Target Profile")
        
        target_effects = st.multiselect(
            "Desired Effects:",
            ["Relaxation", "Pain Relief", "Sleep", "Focus", "Energy", "Creativity", "Appetite"],
            default=["Relaxation", "Pain Relief"]
        )
        
        product_type = st.selectbox(
            "Product Type:",
            ["Flower", "Vape Cartridge", "Edibles", "Tincture", "Topical", "Concentrate"]
        )
        
        st.subheader("🧪 Cannabinoid Profile")
        thc_content = st.slider("THC (%)", 0.0, 30.0, 20.0, 0.1)
        cbd_content = st.slider("CBD (%)", 0.0, 25.0, 5.0, 0.1)
        cbg_content = st.slider("CBG (%)", 0.0, 5.0, 1.0, 0.1)
        
        total_cannabinoids = thc_content + cbd_content + cbg_content
        st.metric("Total Cannabinoids", f"{total_cannabinoids:.1f}%")
        
        if total_cannabinoids > 30:
            st.warning("⚠️ Total cannabinoids exceed typical ranges")
    
    with col2:
        st.subheader("🌿 Terpene Profile")
        
        # Terpene selection with effects
        terpene_effects = {
            "Myrcene": ["Relaxation", "Sleep", "Pain Relief"],
            "Limonene": ["Energy", "Focus", "Mood"],
            "Pinene": ["Focus", "Memory", "Alertness"],
            "Linalool": ["Relaxation", "Sleep", "Anxiety Relief"],
            "Caryophyllene": ["Pain Relief", "Anti-inflammatory"],
            "Humulene": ["Appetite Suppression", "Anti-inflammatory"],
            "Terpinolene": ["Creativity", "Focus", "Uplifting"]
        }
        
        selected_terpenes = {}
        for terpene, effects in terpene_effects.items():
            if any(effect in target_effects for effect in effects):
                selected_terpenes[terpene] = st.slider(
                    f"{terpene} (%)", 0.0, 3.0, 1.0, 0.1
                )
        
        # Terpene profile visualization
        if selected_terpenes:
            terpene_df = pd.DataFrame(
                list(selected_terpenes.items()),
                columns=["Terpene", "Percentage"]
            )
            
            fig = px.pie(
                terpene_df,
                values="Percentage",
                names="Terpene",
                title="Terpene Profile Distribution"
            )
            st.plotly_chart(fig, use_container_width=True)
        
        # Formulation recommendations
        st.subheader("💡 Recommendations")
        
        if target_effects:
            st.success("✅ Formulation optimized for:")
            for effect in target_effects:
                st.write(f"• {effect}")
            
            # Calculate synergy score
            synergy_score = np.random.uniform(0.8, 0.95)  # Placeholder calculation
            st.metric("Synergy Score", f"{synergy_score:.1%}")
            
            if synergy_score > 0.9:
                st.success("🎯 Excellent cannabinoid-terpene synergy predicted!")
            else:
                st.info("💡 Consider adjusting terpene ratios for better synergy")

elif analysis_type == "Quality Control":
    st.header("🔍 Quality Control Dashboard")
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.subheader("📊 Sample Analysis")
        
        # Sample input
        sample_data = {
            "THC": st.number_input("THC (%)", 0.0, 35.0, 22.5),
            "CBD": st.number_input("CBD (%)", 0.0, 30.0, 1.2),
            "CBG": st.number_input("CBG (%)", 0.0, 10.0, 0.8),
            "Moisture": st.number_input("Moisture (%)", 0.0, 20.0, 8.5),
        }
        
        # Quality metrics
        st.subheader("✅ Quality Metrics")
        
        # Potency check
        total_thc = sample_data["THC"]
        if 18 <= total_thc <= 28:
            st.success(f"✅ THC potency: {total_thc}% (Within target range)")
        else:
            st.warning(f"⚠️ THC potency: {total_thc}% (Outside target range: 18-28%)")
        
        # Moisture check
        moisture = sample_data["Moisture"]
        if moisture <= 12:
            st.success(f"✅ Moisture content: {moisture}% (Acceptable)")
        else:
            st.error(f"❌ Moisture content: {moisture}% (Too high, risk of mold)")
        
        # Calculate quality score
        quality_score = 85 + np.random.uniform(-10, 10)
        st.metric("Overall Quality Score", f"{quality_score:.1f}/100")
    
    with col2:
        st.subheader("📈 Batch Trends")
        
        # Generate sample batch data
        dates = pd.date_range(start="2024-01-01", periods=30, freq="D")
        batch_data = pd.DataFrame({
            "Date": dates,
            "THC": 22.5 + np.random.normal(0, 1.5, 30),
            "CBD": 1.2 + np.random.normal(0, 0.3, 30),
            "Quality_Score": 85 + np.random.normal(0, 5, 30)
        })
        
        # THC trend
        fig_thc = px.line(batch_data, x="Date", y="THC", title="THC Potency Trend")
        fig_thc.add_hline(y=20, line_dash="dash", line_color="green", annotation_text="Target")
        st.plotly_chart(fig_thc, use_container_width=True)
        
        # Quality score trend
        fig_quality = px.line(batch_data, x="Date", y="Quality_Score", title="Quality Score Trend")
        fig_quality.add_hline(y=80, line_dash="dash", line_color="orange", annotation_text="Minimum")
        st.plotly_chart(fig_quality, use_container_width=True)

elif analysis_type == "Extraction Optimization":
    st.header("⚗️ Extraction Method Optimization")
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.subheader("🔧 Extraction Parameters")
        
        extraction_method = st.selectbox(
            "Extraction Method:",
            ["CO2 Supercritical", "Ethanol", "Hydrocarbon", "Rosin Press", "Ice Water"]
        )
        
        if extraction_method == "CO2 Supercritical":
            temperature = st.slider("Temperature (°C)", 20, 80, 40)
            pressure = st.slider("Pressure (bar)", 100, 500, 300)
            time = st.slider("Extraction Time (min)", 30, 180, 90)
            
            # Predict yield
            yield_prediction = 15 + (temperature - 40) * 0.1 + (pressure - 300) * 0.01
            yield_prediction = max(10, min(25, yield_prediction + np.random.uniform(-2, 2)))
            
        elif extraction_method == "Ethanol":
            temperature = st.slider("Temperature (°C)", -80, 25, -20)
            time = st.slider("Soak Time (min)", 5, 60, 15)
            ratio = st.slider("Solvent:Material Ratio", 3, 10, 6)
            
            yield_prediction = 18 + (25 - abs(temperature)) * 0.05 + (ratio - 6) * 0.2
            yield_prediction = max(12, min(28, yield_prediction + np.random.uniform(-2, 2)))
        
        else:
            st.info(f"Parameters for {extraction_method} coming soon...")
            yield_prediction = np.random.uniform(12, 22)
    
    with col2:
        st.subheader("📊 Optimization Results")
        
        # Yield prediction
        st.metric("Predicted Yield", f"{yield_prediction:.1f}%")
        
        if yield_prediction > 20:
            st.success("🎯 Excellent yield predicted!")
        elif yield_prediction > 15:
            st.info("✅ Good yield predicted")
        else:
            st.warning("⚠️ Low yield - consider parameter adjustment")
        
        # Quality factors
        st.subheader("🔍 Quality Factors")
        
        quality_factors = {
            "Cannabinoid Preservation": np.random.uniform(0.85, 0.98),
            "Terpene Retention": np.random.uniform(0.70, 0.95),
            "Chlorophyll Removal": np.random.uniform(0.80, 0.99),
            "Residual Solvents": np.random.uniform(0.90, 0.99)
        }
        
        factors_df = pd.DataFrame(
            [(k, f"{v:.1%}") for k, v in quality_factors.items()],
            columns=["Factor", "Score"]
        )
        st.dataframe(factors_df, use_container_width=True)
        
        # Optimization suggestions
        st.subheader("💡 Optimization Suggestions")
        
        if extraction_method == "CO2 Supercritical":
            if temperature > 60:
                st.warning("• Consider lowering temperature to preserve terpenes")
            if pressure < 200:
                st.info("• Increase pressure for better cannabinoid extraction")
        
        st.success("• Current parameters show good balance of yield and quality")
        st.info("• Monitor for consistency across batches")

# Footer
st.markdown("---")
st.markdown("**🧪 Formulation Agent** - Powered by RDKit and Streamlit | 🚀 Built for Cannabis Innovation")